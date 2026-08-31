import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COMPATIBLE_PROTOCOL_SCHEMA_VERSION } from '@codaco/interview/protocol-schema-version';
import { hashProtocol, migrateProtocol } from '@codaco/protocol-validation';
import {
  buildAssetManifest,
  migrateProtocolsToCompatibleVersion,
} from '~/scripts/migrate-protocols';

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

describe('migrateProtocolsToCompatibleVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is a no-op when there are no v7 protocols', async () => {
    const prisma = makeMockPrisma();

    await migrateProtocolsToCompatibleVersion(
      prisma as unknown as Parameters<
        typeof migrateProtocolsToCompatibleVersion
      >[0],
    );

    expect(prisma.protocol.update).not.toHaveBeenCalled();
  });

  it('migrates a v7 protocol row up to the compatible version and writes the result back', async () => {
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

    await migrateProtocolsToCompatibleVersion(
      prisma as unknown as Parameters<
        typeof migrateProtocolsToCompatibleVersion
      >[0],
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
    expect(updateCall.data.schemaVersion).toBe(
      COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
    );
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

    await migrateProtocolsToCompatibleVersion(
      prisma as unknown as Parameters<
        typeof migrateProtocolsToCompatibleVersion
      >[0],
    );

    type UpdateCallArg = { data: { hash: string } };
    const dbCall = prisma.protocol.update.mock.calls[0]?.[0] as UpdateCallArg;
    const dbHash = dbCall.data.hash;

    // (b) Independently run the same v7 protocol through the same migration
    // chain the import flow uses (useProtocolImport.tsx strips .netcanvas
    // before passing as the `name` dependency).
    const importName = 'My Protocol.netcanvas'.replace(/\.netcanvas$/i, '');
    const importMigrated = migrateProtocol(
      { ...v7, name: importName },
      COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
      { name: importName },
    );
    const importHash = hashProtocol(importMigrated);

    expect(dbHash).toBe(importHash);
  });

  it('leaves an unmigratable protocol in place without failing the deployment', async () => {
    // Rows stored under an older, more permissive validator can fail the
    // corrected rules; one such row must never block a customer's upgrade.
    // The runtime payload guard refuses its interviews instead.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
      migrateProtocolsToCompatibleVersion(
        prisma as unknown as Parameters<
          typeof migrateProtocolsToCompatibleVersion
        >[0],
      ),
    ).resolves.toBeUndefined();

    // Nothing was written for the broken row, and the failure names it.
    expect(prisma.protocol.update).not.toHaveBeenCalled();
    const logged = errorSpy.mock.calls.map((call) => String(call[0])).join(' ');
    expect(logged).toMatch(/Broken Protocol\.netcanvas/);
    expect(logged).toMatch(/cm-broken/);
    errorSpy.mockRestore();
  });

  it('normalizes a protocol stored at the compatible version that is not conformant', async () => {
    // A protocol stored at the compatible version but still carrying legacy
    // field shapes (iconVariant, Toggle options). These slip past the
    // below-target filter yet fail the strict read-time CurrentProtocolSchema,
    // so they must be re-normalized through the migration chain.
    const legacyShaped = makeV7Protocol();
    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-mislabelled',
        assets: [],
        name: 'Mislabelled.netcanvas',
        schemaVersion: COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
        stages: legacyShaped.stages,
        codebook: legacyShaped.codebook,
        experiments: null,
        description: legacyShaped.description,
        lastModified: new Date(legacyShaped.lastModified),
      },
    ]);

    await migrateProtocolsToCompatibleVersion(
      prisma as unknown as Parameters<
        typeof migrateProtocolsToCompatibleVersion
      >[0],
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

    expect(call.where).toEqual({ id: 'cm-mislabelled' });
    expect(call.data.schemaVersion).toBe(COMPATIBLE_PROTOCOL_SCHEMA_VERSION);
    // iconVariant → icon proves the v7→v8 migration actually ran on the
    // mislabelled protocol rather than leaving its legacy shape untouched.
    expect(call.data.codebook.node.person.icon).toBe('add-a-person');
    expect(call.data.codebook.node.person).not.toHaveProperty('iconVariant');
  });

  it('preserves stored experiments when normalizing a non-conformant protocol', async () => {
    // Experiments exist only at the compatible version and the migration chain
    // predates them, so both write paths must carry the stored value through
    // rather than resetting it to the chain's default.
    const legacyShaped = makeV7Protocol();
    const storedExperiments = { encryptedVariables: true };
    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-experiments',
        assets: [],
        name: 'With Experiments.netcanvas',
        schemaVersion: COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
        stages: legacyShaped.stages,
        codebook: legacyShaped.codebook,
        experiments: storedExperiments,
        description: legacyShaped.description,
        lastModified: new Date(legacyShaped.lastModified),
      },
    ]);

    await migrateProtocolsToCompatibleVersion(
      prisma as unknown as Parameters<
        typeof migrateProtocolsToCompatibleVersion
      >[0],
    );

    expect(prisma.protocol.update).toHaveBeenCalledTimes(1);
    const call = prisma.protocol.update.mock.calls[0]?.[0] as {
      data: { experiments: unknown };
    };
    expect(call.data.experiments).toEqual(storedExperiments);
  });

  it('normalizes non-conformant asset-referencing protocols', async () => {
    // The re-migration input must include the manifest reconstructed from the
    // Asset rows, or migration of any asset-referencing protocol would fail
    // its output validation.
    const mixed = makeV7Protocol();
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
        id: 'cm-asset-current',
        assets: [
          {
            assetId: 'asset-roster-1',
            name: 'roster.csv',
            type: 'network',
            value: null,
          },
        ],
        name: 'AssetProtocol.netcanvas',
        schemaVersion: COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
        stages: mixed.stages,
        codebook: mixed.codebook,
        experiments: null,
        description: mixed.description,
        lastModified: new Date(mixed.lastModified),
      },
    ]);

    await migrateProtocolsToCompatibleVersion(
      prisma as unknown as Parameters<
        typeof migrateProtocolsToCompatibleVersion
      >[0],
    );

    expect(prisma.protocol.update).toHaveBeenCalledTimes(1);
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
      COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
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
        schemaVersion: COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
        stages: conformant.stages,
        codebook: conformant.codebook,
        experiments: conformant.experiments ?? null,
        description: null,
        lastModified: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);

    await migrateProtocolsToCompatibleVersion(
      prisma as unknown as Parameters<
        typeof migrateProtocolsToCompatibleVersion
      >[0],
    );

    expect(prisma.protocol.update).not.toHaveBeenCalled();
  });

  it('conformant protocols at the compatible version are left untouched', async () => {
    // Start from a fully-migrated protocol so it already satisfies the strict
    // schema; the migration must skip it (no re-write, no hash churn).
    const v7 = makeV7Protocol();
    const conformant = migrateProtocol(
      { ...v7, name: 'Clean' },
      COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
      { name: 'Clean' },
    );

    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-clean-current',
        assets: [],
        name: 'Clean.netcanvas',
        schemaVersion: COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
        stages: conformant.stages,
        codebook: conformant.codebook,
        experiments: conformant.experiments ?? null,
        description: null,
        lastModified: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);

    await migrateProtocolsToCompatibleVersion(
      prisma as unknown as Parameters<
        typeof migrateProtocolsToCompatibleVersion
      >[0],
    );

    expect(prisma.protocol.update).not.toHaveBeenCalled();
  });

  it('leaves a non-normalizable protocol in place without throwing', async () => {
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const prisma = makeMockPrisma();
    prisma.protocol.findMany.mockResolvedValue([
      {
        id: 'cm-unfixable',
        assets: [],
        name: 'Unfixable.netcanvas',
        schemaVersion: COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
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
      migrateProtocolsToCompatibleVersion(
        prisma as unknown as Parameters<
          typeof migrateProtocolsToCompatibleVersion
        >[0],
      ),
    ).resolves.toBeUndefined();

    expect(prisma.protocol.update).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unfixable.netcanvas'),
    );
    warnSpy.mockRestore();
  });

  it('detects a hash collision before writing and names both protocols', async () => {
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

    // The pre-write check finds the colliding row by hash. Raising the actual
    // constraint violation is not an option — inside setup-database's single
    // PostgreSQL transaction it would poison every subsequent statement.
    prisma.protocol.findFirst.mockResolvedValue({
      id: 'cm-existing',
      name: 'Existing.netcanvas',
    });

    // A hash collision is tolerated like any other per-row failure — the
    // deployment completes and the log names both rows so the administrator
    // can resolve the duplicate.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      migrateProtocolsToCompatibleVersion(
        prisma as unknown as Parameters<
          typeof migrateProtocolsToCompatibleVersion
        >[0],
      ),
    ).resolves.toBeUndefined();

    const logged = errorSpy.mock.calls.map((call) => String(call[0])).join(' ');
    expect(logged).toMatch(/cm-collide/);
    expect(logged).toMatch(/Colliding\.netcanvas/);
    expect(logged).toMatch(/cm-existing/);
    expect(logged).toMatch(/Existing\.netcanvas/);
    // Detected BEFORE any write: the constraint violation itself would poison
    // the surrounding PostgreSQL transaction.
    expect(prisma.protocol.update).not.toHaveBeenCalled();
    errorSpy.mockRestore();
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
