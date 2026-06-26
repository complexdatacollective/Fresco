import { hashProtocol, migrateProtocol } from '@codaco/protocol-validation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAssetManifest,
  migrateProtocolsToV8,
} from '~/scripts/migrate-protocols-to-v8';

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
  protocol: {
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
};

function makeMockPrisma(): MockPrisma {
  return {
    protocol: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };
}

describe('migrateProtocolsToV8', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is a no-op when there are no v7 protocols', async () => {
    const prisma = makeMockPrisma();

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(prisma.protocol.update).not.toHaveBeenCalled();
  });

  it('migrates a v7 protocol row to v8 and writes the result back', async () => {
    const v7 = makeV7Protocol();
    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-protocol-1',
        assets: [],
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
        assets: [],
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
        assets: [],
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
        assets: [],
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

describe('buildAssetManifest', () => {
  it('reconstructs a file-asset manifest entry from a stored Asset row', () => {
    const manifest = buildAssetManifest([
      {
        assetId: 'asset-network-1',
        name: 'roster-source.csv',
        type: 'network',
        value: null,
      },
    ]);

    expect(manifest['asset-network-1']).toEqual({
      id: 'asset-network-1',
      name: 'roster-source.csv',
      type: 'network',
      source: 'roster-source.csv',
    });
  });

  it('reconstructs an apikey manifest entry using value, not source', () => {
    const manifest = buildAssetManifest([
      {
        assetId: 'asset-key-1',
        name: 'Mapbox token',
        type: 'apikey',
        value: 'pk.secret',
      },
    ]);

    expect(manifest['asset-key-1']).toEqual({
      id: 'asset-key-1',
      name: 'Mapbox token',
      type: 'apikey',
      value: 'pk.secret',
    });
  });

  it('keys every asset by its assetId', () => {
    const manifest = buildAssetManifest([
      { assetId: 'a', name: 'a.png', type: 'image', value: null },
      { assetId: 'b', name: 'b.geojson', type: 'geojson', value: null },
    ]);

    expect(Object.keys(manifest)).toEqual(['a', 'b']);
  });
});
