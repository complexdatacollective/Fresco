import { hashProtocol, migrateProtocol } from '@codaco/protocol-validation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateProtocolsToV8 } from '~/scripts/migrate-protocols-to-v8';

const mockDeleteFiles = vi.fn().mockResolvedValue({ success: true });
vi.mock('uploadthing/server', () => ({
  UTApi: vi.fn(function () {
    return { deleteFiles: mockDeleteFiles };
  }),
}));

const mockS3Send = vi.fn().mockResolvedValue({});
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function () {
    return { send: mockS3Send };
  }),
  DeleteObjectsCommand: vi.fn(function (input: unknown) {
    return { input };
  }),
}));

/**
 * A minimal v7 protocol JSON containing the fields the v7→v8 migration
 * actually transforms (iconVariant on a node, Toggle with options, alter
 * filter rule). This lets the tests verify the real migration applies, not
 * just that some hand-rolled stub produced the right output.
 */
function makeV7Protocol() {
  return {
    schemaVersion: 7,
    description: 'Test protocol',
    lastModified: '2024-01-01T00:00:00.000Z',
    codebook: {
      node: {
        person: {
          name: 'Person',
          color: 'node-color-seq-1',
          iconVariant: 'add-a-person',
          variables: {
            isAttending: {
              name: 'isAttending',
              type: 'boolean',
              component: 'Toggle',
              options: [
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ],
            },
          },
        },
      },
      edge: {},
      ego: { variables: {} },
    },
    stages: [
      {
        id: 'stage-1',
        type: 'Information',
        label: 'Stage 1',
        items: [],
      },
    ],
  };
}

type MockPrisma = {
  asset: {
    findMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  protocol: {
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  appSettings: { findMany: ReturnType<typeof vi.fn> };
};

function makeMockPrisma(): MockPrisma {
  return {
    asset: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    protocol: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue(null),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    appSettings: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

describe('migrateProtocolsToV8', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteFiles.mockResolvedValue({ success: true });
    mockS3Send.mockResolvedValue({});
  });

  it('is a no-op when there are no preview protocols and no v7 protocols', async () => {
    const prisma = makeMockPrisma();

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    // Preview cleanup always runs (deleteMany on an empty set is a no-op).
    expect(prisma.protocol.deleteMany).toHaveBeenCalledWith({
      where: { isPreview: true },
    });
    expect(prisma.asset.deleteMany).not.toHaveBeenCalled();
    expect(prisma.protocol.update).not.toHaveBeenCalled();
  });

  it('deletes Asset rows that are attached only to preview protocols', async () => {
    const prisma = makeMockPrisma();
    prisma.asset.findMany.mockResolvedValue([
      { key: 'orphan-key-1' },
      { key: 'orphan-key-2' },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    // The findMany filter must scope to assets attached to at least one
    // preview protocol and not shared with any installed protocol.
    expect(prisma.asset.findMany).toHaveBeenCalledWith({
      where: {
        protocols: { some: { isPreview: true } },
        AND: { protocols: { every: { isPreview: true } } },
      },
      select: { key: true },
    });

    // Preview protocols must be deleted *before* the Asset rows so the join
    // rows are removed and the Asset rows become unreferenced.
    const previewDeleteCallOrder =
      prisma.protocol.deleteMany.mock.invocationCallOrder[0]!;
    const assetDeleteCallOrder =
      prisma.asset.deleteMany.mock.invocationCallOrder[0]!;
    expect(previewDeleteCallOrder).toBeLessThan(assetDeleteCallOrder);

    expect(prisma.asset.deleteMany).toHaveBeenCalledWith({
      where: { key: { in: ['orphan-key-1', 'orphan-key-2'] } },
    });
  });

  it('deletes orphan blobs from UploadThing when provider is uploadthing', async () => {
    const prisma = makeMockPrisma();
    prisma.asset.findMany.mockResolvedValue([
      { key: 'ut-orphan-1' },
      { key: 'ut-orphan-2' },
    ]);
    prisma.appSettings.findMany.mockResolvedValue([
      { key: 'storageProvider', value: 'uploadthing' },
      { key: 'uploadThingToken', value: 'sk_test_token' },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(mockDeleteFiles).toHaveBeenCalledWith([
      'ut-orphan-1',
      'ut-orphan-2',
    ]);
  });

  it('deletes orphan blobs from S3 when provider is s3', async () => {
    const prisma = makeMockPrisma();
    prisma.asset.findMany.mockResolvedValue([
      { key: 's3-orphan-1' },
      { key: 's3-orphan-2' },
    ]);
    prisma.appSettings.findMany.mockResolvedValue([
      { key: 'storageProvider', value: 's3' },
      { key: 's3Endpoint', value: 'https://s3.example.com' },
      { key: 's3Region', value: 'us-east-1' },
      { key: 's3Bucket', value: 'fresco-bucket' },
      { key: 's3AccessKeyId', value: 'AKIATEST' },
      { key: 's3SecretAccessKey', value: 'secret' },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(mockS3Send).toHaveBeenCalledTimes(1);

    // The DeleteObjectsCommand was constructed with both keys
    const { DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
    expect(DeleteObjectsCommand).toHaveBeenCalledWith({
      Bucket: 'fresco-bucket',
      Delete: {
        Objects: [{ Key: 's3-orphan-1' }, { Key: 's3-orphan-2' }],
      },
    });
  });

  it('logs and continues when blob deletion fails', async () => {
    const prisma = makeMockPrisma();
    prisma.asset.findMany.mockResolvedValue([{ key: 'will-fail' }]);
    prisma.appSettings.findMany.mockResolvedValue([
      { key: 'storageProvider', value: 'uploadthing' },
      { key: 'uploadThingToken', value: 'sk_test' },
    ]);
    mockDeleteFiles.mockRejectedValue(new Error('UploadThing is down'));

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

    await expect(
      migrateProtocolsToV8(
        prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
      ),
    ).resolves.toBeUndefined();

    // The DB cleanup should still happen
    expect(prisma.asset.deleteMany).toHaveBeenCalledWith({
      where: { key: { in: ['will-fail'] } },
    });

    expect(errorSpy).toHaveBeenCalledWith(
      'Blob cleanup failed (continuing):',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });

  it('migrates a v7 protocol row to v8 and writes the result back', async () => {
    const v7 = makeV7Protocol();
    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-protocol-1',
        name: 'Test Protocol.netcanvas',
        schemaVersion: 7,
        stages: v7.stages,
        codebook: v7.codebook,
        experiments: null,
        description: v7.description,
        lastModified: new Date(v7.lastModified),
      },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(prisma.protocol.update).toHaveBeenCalledTimes(1);

    type UpdateCallArg = {
      where: { id: string };
      data: {
        schemaVersion: number;
        experiments: unknown;
        codebook: {
          node: { person: Record<string, unknown> };
        };
        hash: string;
      };
    };

    const rawCall: unknown = prisma.protocol.update.mock.calls[0]?.[0];
    expect(rawCall).toBeDefined();
    const updateCall = rawCall as UpdateCallArg;

    expect(updateCall.where).toEqual({ id: 'cm-protocol-1' });
    expect(updateCall.data.schemaVersion).toBe(8);
    expect(updateCall.data.experiments).toEqual({});

    // iconVariant → icon, with shape added
    const personNode = updateCall.data.codebook.node.person;
    expect(personNode.icon).toBe('add-a-person');
    expect(personNode).not.toHaveProperty('iconVariant');
    expect(personNode.shape).toEqual({ default: 'circle' });

    // Toggle options removed
    const toggleVar = personNode.variables as {
      isAttending: Record<string, unknown>;
    };
    expect(toggleVar.isAttending).not.toHaveProperty('options');

    // Hash recomputed
    expect(typeof updateCall.data.hash).toBe('string');
    expect(updateCall.data.hash.length).toBeGreaterThan(0);
  });

  it('produces a hash identical to what the import flow would produce', async () => {
    const v7 = makeV7Protocol();

    // (a) Run it through our migration script
    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-x',
        name: 'My Protocol.netcanvas',
        schemaVersion: 7,
        stages: v7.stages,
        codebook: v7.codebook,
        experiments: null,
        description: v7.description,
        lastModified: new Date(v7.lastModified),
      },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    type UpdateCallArg = { data: { hash: string } };
    const dbCall = prisma.protocol.update.mock.calls[0]?.[0] as UpdateCallArg;
    const dbHash = dbCall.data.hash;

    // (b) Independently run the same v7 protocol through the same migration
    // chain the import flow uses (useProtocolImport.tsx strips .netcanvas
    // before passing as the `name` dependency).
    const importName = 'My Protocol.netcanvas'.replace(/\.netcanvas$/i, '');
    const importMigrated = migrateProtocol({ ...v7, name: importName }, 8, {
      name: importName,
    });
    const importHash = hashProtocol(importMigrated);

    expect(dbHash).toBe(importHash);
  });

  it('hard-fails with id and name when a protocol fails to migrate', async () => {
    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-broken',
        name: 'Broken Protocol.netcanvas',
        schemaVersion: 7,
        // `stages` is required to be an array — passing a non-array makes
        // VersionedProtocolSchema reject this protocol inside migrateProtocol.
        stages: 'not-an-array',
        codebook: { node: {}, edge: {}, ego: { variables: {} } },
        experiments: null,
        description: null,
        lastModified: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);

    await expect(
      migrateProtocolsToV8(
        prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
      ),
    ).rejects.toThrow(/Broken Protocol\.netcanvas/);

    await expect(
      migrateProtocolsToV8(
        prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
      ),
    ).rejects.toThrow(/cm-broken/);
  });

  it('wraps a P2002 hash collision with both protocol ids and names', async () => {
    const v7 = makeV7Protocol();
    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-collide',
        name: 'Colliding.netcanvas',
        schemaVersion: 7,
        stages: v7.stages,
        codebook: v7.codebook,
        experiments: null,
        description: v7.description,
        lastModified: new Date(v7.lastModified),
      },
    ]);

    // Simulate Prisma's P2002 unique-constraint error
    const { Prisma } = await import('~/lib/db/generated/client');
    const p2002 = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`hash`)',
      { code: 'P2002', clientVersion: 'test', meta: { target: ['hash'] } },
    );
    prisma.protocol.update.mockRejectedValue(p2002);

    // The script will look up the colliding row by hash
    prisma.protocol.findFirst.mockResolvedValue({
      id: 'cm-existing',
      name: 'Existing.netcanvas',
    });

    const error = await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    expect(message).toMatch(/cm-collide/);
    expect(message).toMatch(/Colliding\.netcanvas/);
    expect(message).toMatch(/cm-existing/);
    expect(message).toMatch(/Existing\.netcanvas/);
  });
});
