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

  it('normalizes a schemaVersion-8 protocol that is not conformant with the strict v8 schema', async () => {
    // A protocol stored as schemaVersion 8 but still carrying pre-v8 field
    // shapes (iconVariant, Toggle options). These slip past the `schemaVersion
    // < 8` filter yet fail the strict read-time CurrentProtocolSchema, so they
    // must be re-normalized through the v7→v8 migration.
    const legacyShaped = makeV7Protocol();
    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-mislabelled-v8',
        assets: [],
        name: 'Mislabelled.netcanvas',
        schemaVersion: 8,
        stages: legacyShaped.stages,
        codebook: legacyShaped.codebook,
        experiments: null,
        description: legacyShaped.description,
        lastModified: new Date(legacyShaped.lastModified),
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
        codebook: { node: { person: Record<string, unknown> } };
        hash: string;
      };
    };
    const call = prisma.protocol.update.mock.calls[0]?.[0] as UpdateCallArg;

    expect(call.where).toEqual({ id: 'cm-mislabelled-v8' });
    expect(call.data.schemaVersion).toBe(8);
    // iconVariant → icon proves the v7→v8 migration actually ran on the
    // mislabelled protocol rather than leaving its legacy shape untouched.
    expect(call.data.codebook.node.person.icon).toBe('add-a-person');
    expect(call.data.codebook.node.person).not.toHaveProperty('iconVariant');
  });

  it('preserves authored v8 state (node shape, required semantics) when normalizing', async () => {
    // A mislabelled-v8 body: legacy pre-v8 field shapes (iconVariant, Toggle
    // options) force re-normalization, but the row ALSO carries authored v8
    // state the v7→v8 migration would destroy. Since protocol-validation
    // 11.9.0 tightened CurrentProtocolSchema, rows like this can newly fail
    // conformance, and normalization must not corrupt the authored values.
    //
    // Required-flag semantics mirror what Fresco's legacy form engine
    // actually did: minLength/minSelected failed empty values (so the
    // migration's required:true preserves observed behaviour and must stay),
    // while minValue passed empty values (so a min-valued variable without
    // `required` was optional and must remain so). Explicit `required` values
    // are always restored.
    const mixed = makeV7Protocol();
    const personNode = mixed.codebook.node.person as Record<string, unknown>;
    personNode.shape = { default: 'square' };
    Object.assign(personNode.variables as Record<string, unknown>, {
      nickname: {
        name: 'nickname',
        type: 'text',
        component: 'Text',
        validation: { minLength: 2 },
      },
      age: {
        name: 'age',
        type: 'number',
        component: 'Number',
        validation: { minValue: 1 },
      },
      bio: {
        name: 'bio',
        type: 'text',
        component: 'TextArea',
        validation: { minLength: 5, required: false },
      },
    });

    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-authored-v8',
        assets: [],
        name: 'Authored.netcanvas',
        schemaVersion: 8,
        stages: mixed.stages,
        codebook: mixed.codebook,
        experiments: null,
        description: mixed.description,
        lastModified: new Date(mixed.lastModified),
      },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(prisma.protocol.update).toHaveBeenCalledTimes(1);

    type UpdateCallArg = {
      data: {
        codebook: {
          node: {
            person: {
              icon: string;
              shape: Record<string, unknown>;
              variables: Record<
                string,
                { validation?: Record<string, unknown> }
              >;
            };
          };
        };
      };
    };
    const call = prisma.protocol.update.mock.calls[0]?.[0] as UpdateCallArg;
    const person = call.data.codebook.node.person;

    // Legacy shapes were still normalized...
    expect(person.icon).toBe('add-a-person');
    expect(person).not.toHaveProperty('iconVariant');
    // ...but the authored shape config survives instead of being reset to
    // { default: 'circle' }...
    expect(person.shape).toEqual({ default: 'square' });
    // ...minLength keeps the migration's required:true (legacy engine failed
    // empty values, so the field was effectively required)...
    expect(person.variables.nickname?.validation).toEqual({
      minLength: 2,
      required: true,
    });
    // ...minValue-only stays optional (legacy engine passed empty values)...
    expect(person.variables.age?.validation).toEqual({ minValue: 1 });
    // ...and an explicit required value is restored verbatim.
    expect(person.variables.bio?.validation).toEqual({
      minLength: 5,
      required: false,
    });
  });

  it('normalizes asset-referencing protocols without discarding authored state', async () => {
    // The whole-protocol schema cross-references roster/geospatial dataSource
    // ids against the asset manifest. Both the conformance check and the
    // restored-body re-parse must reconstruct the manifest from the Asset
    // rows, or every asset-referencing protocol would re-normalize on each
    // deploy and lose its authored state to the fallback path.
    const mixed = makeV7Protocol();
    const personNode = mixed.codebook.node.person as Record<string, unknown>;
    personNode.shape = { default: 'square' };
    mixed.stages.push({
      id: 'stage-roster',
      type: 'NameGeneratorRoster',
      label: 'Roster',
      subject: { entity: 'node', type: 'person' },
      dataSource: 'asset-roster-1',
      prompts: [{ id: 'p1', text: 'Who?' }],
    } as unknown as (typeof mixed.stages)[number]);

    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-asset-v8',
        assets: [
          {
            assetId: 'asset-roster-1',
            name: 'roster.csv',
            type: 'network',
            value: null,
          },
        ],
        name: 'AssetProtocol.netcanvas',
        schemaVersion: 8,
        stages: mixed.stages,
        codebook: mixed.codebook,
        experiments: null,
        description: mixed.description,
        lastModified: new Date(mixed.lastModified),
      },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(prisma.protocol.update).toHaveBeenCalledTimes(1);

    type UpdateCallArg = {
      data: {
        codebook: { node: { person: { shape: Record<string, unknown> } } };
      };
    };
    const call = prisma.protocol.update.mock.calls[0]?.[0] as UpdateCallArg;
    // Restoration succeeded (no fallback to the shape-resetting plain output)
    // even though the protocol references a stored asset.
    expect(call.data.codebook.node.person.shape).toEqual({
      default: 'square',
    });
  });

  it('skips conformant asset-referencing protocols instead of re-normalizing them each deploy', async () => {
    const v7 = makeV7Protocol();
    v7.stages.push({
      id: 'stage-roster',
      type: 'NameGeneratorRoster',
      label: 'Roster',
      subject: { entity: 'node', type: 'person' },
      dataSource: 'asset-roster-1',
      prompts: [{ id: 'p1', text: 'Who?' }],
    } as unknown as (typeof v7.stages)[number]);
    const conformant = migrateProtocol(
      {
        ...v7,
        name: 'CleanAssets',
        assetManifest: {
          'asset-roster-1': {
            id: 'asset-roster-1',
            name: 'roster.csv',
            type: 'network',
            source: 'roster.csv',
          },
        },
      },
      8,
      { name: 'CleanAssets' },
    );

    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-clean-assets',
        assets: [
          {
            assetId: 'asset-roster-1',
            name: 'roster.csv',
            type: 'network',
            value: null,
          },
        ],
        name: 'CleanAssets.netcanvas',
        schemaVersion: 8,
        stages: conformant.stages,
        codebook: conformant.codebook,
        experiments: conformant.experiments ?? null,
        description: null,
        lastModified: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(prisma.protocol.update).not.toHaveBeenCalled();
  });

  it('falls back to the plain re-migration output when authored state cannot be restored', async () => {
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    // The authored shape config is invalid v8, so restoring it would produce
    // a body that fails the strict schema; normalization must persist the
    // valid migration output instead of writing a broken body back.
    const mixed = makeV7Protocol();
    (mixed.codebook.node.person as Record<string, unknown>).shape = {
      default: 'not-a-real-shape',
    };

    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-bad-authored',
        assets: [],
        name: 'BadAuthored.netcanvas',
        schemaVersion: 8,
        stages: mixed.stages,
        codebook: mixed.codebook,
        experiments: null,
        description: mixed.description,
        lastModified: new Date(mixed.lastModified),
      },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(prisma.protocol.update).toHaveBeenCalledTimes(1);

    type UpdateCallArg = {
      data: {
        codebook: { node: { person: { shape: Record<string, unknown> } } };
      };
    };
    const call = prisma.protocol.update.mock.calls[0]?.[0] as UpdateCallArg;
    expect(call.data.codebook.node.person.shape).toEqual({
      default: 'circle',
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('BadAuthored.netcanvas'),
    );
    warnSpy.mockRestore();
  });

  it('conformant schemaVersion-8 protocols are left untouched', async () => {
    // Start from a fully-migrated v8 protocol so it already satisfies the strict
    // schema; the migration must skip it (no re-write, no hash churn).
    const v7 = makeV7Protocol();
    const conformant = migrateProtocol({ ...v7, name: 'Clean' }, 8, {
      name: 'Clean',
    });

    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-clean-v8',
        assets: [],
        name: 'Clean.netcanvas',
        schemaVersion: 8,
        stages: conformant.stages,
        codebook: conformant.codebook,
        experiments: conformant.experiments ?? null,
        description: null,
        lastModified: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);

    await migrateProtocolsToV8(
      prisma as unknown as Parameters<typeof migrateProtocolsToV8>[0],
    );

    expect(prisma.protocol.update).not.toHaveBeenCalled();
  });

  it('leaves a non-normalizable schemaVersion-8 protocol in place without throwing', async () => {
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-unfixable',
        assets: [],
        name: 'Unfixable.netcanvas',
        schemaVersion: 8,
        // Not an array: fails the strict schema AND cannot be migrated, so the
        // normalization attempt throws internally. It must be logged and left
        // in place rather than aborting the whole deploy transaction.
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
    ).resolves.toBeUndefined();

    expect(prisma.protocol.update).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unfixable.netcanvas'),
    );
    warnSpy.mockRestore();
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
