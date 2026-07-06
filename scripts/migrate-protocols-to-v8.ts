/* eslint-disable no-console */
import { hashProtocol, migrateProtocol } from '@codaco/protocol-validation';
import { Prisma } from '~/lib/db/generated/client';

type ProtocolAssetRow = {
  assetId: string;
  name: string;
  type: string;
  value: string | null;
};

/**
 * Rebuild a protocol's `assetManifest` from its linked Asset rows. Fresco stores
 * assets in a separate table rather than inline on the protocol, but v8 validation
 * resolves NameGeneratorRoster/Geospatial asset references against the manifest, so
 * it must be present for migration to validate. The manifest is excluded from the
 * protocol hash, so reconstructing it here does not affect the computed hash.
 */
export function buildAssetManifest(assets: ProtocolAssetRow[]) {
  const manifest: Record<
    string,
    | { id: string; name: string; type: string; source: string }
    | { id: string; name: string; type: 'apikey'; value: string }
  > = {};

  for (const asset of assets) {
    manifest[asset.assetId] =
      asset.type === 'apikey'
        ? {
            id: asset.assetId,
            name: asset.name,
            type: 'apikey',
            value: asset.value ?? '',
          }
        : {
            id: asset.assetId,
            name: asset.name,
            type: asset.type,
            source: asset.name,
          };
  }

  return manifest;
}

async function migrateOneProtocol(
  prisma: Prisma.TransactionClient,
  row: {
    id: string;
    name: string;
    schemaVersion: number;
    stages: unknown;
    codebook: unknown;
    assets: ProtocolAssetRow[];
  },
): Promise<void> {
  const cleanName = row.name.replace(/\.netcanvas$/i, '');

  const reconstructed = {
    name: cleanName,
    schemaVersion: row.schemaVersion,
    stages: row.stages,
    codebook: row.codebook,
    assetManifest: buildAssetManifest(row.assets),
  };

  let migrated: ReturnType<typeof migrateProtocol>;
  try {
    migrated = migrateProtocol(reconstructed, 8, { name: cleanName });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to migrate protocol "${row.name}" (id=${row.id}): ${cause}`,
    );
  }
  const newHash = hashProtocol(migrated);

  try {
    await prisma.protocol.update({
      where: { id: row.id },
      data: {
        schemaVersion: 8,
        // Branded EntityAttributeReference fields are compile-time-only; erase
        // the brand at the Prisma JSON boundary.
        stages: migrated.stages as Prisma.InputJsonValue,
        codebook: migrated.codebook,
        experiments: migrated.experiments ?? Prisma.JsonNull,
        hash: newHash,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      const collider = await prisma.protocol.findFirst({
        where: { hash: newHash },
        select: { id: true, name: true },
      });
      throw new Error(
        `Hash collision migrating "${row.name}" (id=${row.id}): ` +
          `migrated hash ${newHash} already exists on protocol "${collider?.name ?? '?'}" (id=${collider?.id ?? '?'})`,
      );
    }
    throw err;
  }

  console.log(
    `Migrated "${row.name}" (id=${row.id})... ok (new hash: ${newHash.slice(0, 8)}...)`,
  );
}

/**
 * Migrate any Protocol rows at schemaVersion < 8 up to v8.
 *
 * Idempotent. Hard-fails per protocol on migration errors.
 */
export async function migrateProtocolsToV8(
  prisma: Prisma.TransactionClient,
): Promise<void> {
  const v7Protocols = await prisma.protocol.findMany({
    where: { schemaVersion: { lt: 8 } },
    select: {
      id: true,
      name: true,
      schemaVersion: true,
      stages: true,
      codebook: true,
      assets: {
        select: { assetId: true, name: true, type: true, value: true },
      },
    },
  });

  if (v7Protocols.length === 0) {
    console.log('No protocols at schemaVersion < 8 to migrate.');
    return;
  }

  console.log(
    `Found ${v7Protocols.length} protocols at schemaVersion < 8. Migrating to v8...`,
  );

  for (const row of v7Protocols) {
    await migrateOneProtocol(prisma, row);
  }

  console.log(`Migrated ${v7Protocols.length} protocols.`);
}
