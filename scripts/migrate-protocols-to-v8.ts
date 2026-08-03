/* eslint-disable no-console */
import {
  CurrentProtocolSchema,
  hashProtocol,
  migrateProtocol,
} from '@codaco/protocol-validation';
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

type ProtocolRow = {
  id: string;
  name: string;
  schemaVersion: number;
  stages: unknown;
  codebook: unknown;
  experiments: unknown;
  assets: ProtocolAssetRow[];
};

/**
 * Whether a stored protocol already satisfies the strict schema the Prisma
 * result extension applies on every read (lib/db/index.ts). Mirrors that
 * reconstruction so a protocol this returns `true` for cannot make a read throw.
 */
function isConformantV8(row: ProtocolRow): boolean {
  return CurrentProtocolSchema.safeParse({
    name: row.name.replace(/\.netcanvas$/i, ''),
    schemaVersion: 8,
    stages: row.stages,
    codebook: row.codebook,
    experiments: row.experiments ?? {},
    // The whole-protocol schema cross-references stage asset ids (roster,
    // geospatial) against the manifest, so it must be reconstructed here or
    // every asset-referencing protocol would fail and be re-normalized on
    // each deploy.
    assetManifest: buildAssetManifest(row.assets),
  }).success;
}

/**
 * Persist a migrated protocol, translating a unique-hash collision (P2002) into
 * an actionable error that names both the migrated protocol and the colliding one.
 */
async function writeMigratedProtocol(
  prisma: Prisma.TransactionClient,
  row: ProtocolRow,
  data: Prisma.ProtocolUpdateInput,
  newHash: string,
): Promise<void> {
  try {
    await prisma.protocol.update({ where: { id: row.id }, data });
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
}

async function migrateOneProtocol(
  prisma: Prisma.TransactionClient,
  row: ProtocolRow,
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

  await writeMigratedProtocol(
    prisma,
    row,
    {
      schemaVersion: 8,
      // Branded EntityAttributeReference fields are compile-time-only; erase
      // the brand at the Prisma JSON boundary.
      stages: migrated.stages as Prisma.InputJsonValue,
      codebook: migrated.codebook,
      experiments: migrated.experiments ?? Prisma.JsonNull,
      hash: newHash,
    },
    newHash,
  );

  console.log(
    `Migrated "${row.name}" (id=${row.id})... ok (new hash: ${newHash.slice(0, 8)}...)`,
  );
}

/**
 * Normalize a protocol stored as schemaVersion 8 whose body fails the strict
 * read-time schema (e.g. dev-era rows still carrying pre-v8 field shapes such
 * as object-form `automaticLayout`). Schema 8 was never released, so the
 * current schema is the only schema 8 that exists; a non-conformant row is
 * simply invalid data and is mechanically coerced by re-running the v7→v8
 * migration. Throws if the content is genuinely invalid and cannot be
 * migrated.
 */
async function normalizeMislabelledV8(
  prisma: Prisma.TransactionClient,
  row: ProtocolRow,
): Promise<void> {
  const cleanName = row.name.replace(/\.netcanvas$/i, '');

  const asV7 = {
    name: cleanName,
    schemaVersion: 7,
    stages: row.stages,
    codebook: row.codebook,
    assetManifest: buildAssetManifest(row.assets),
  };

  const migrated = migrateProtocol(asV7, 8, { name: cleanName });

  // The hash is derived from stages + codebook only, so re-normalizing to v8
  // gives the same hash the import flow would now compute for this protocol.
  const newHash = hashProtocol(migrated);

  await writeMigratedProtocol(
    prisma,
    row,
    {
      schemaVersion: 8,
      stages: migrated.stages as Prisma.InputJsonValue,
      codebook: migrated.codebook,
      // Preserve the protocol's existing v8-only experiments; a v7→v8 migration
      // has no knowledge of them and would otherwise reset them to its default.
      experiments: row.experiments ?? Prisma.JsonNull,
      hash: newHash,
    },
    newHash,
  );

  console.log(
    `Normalized mislabelled v8 protocol "${row.name}" (id=${row.id})... ok (new hash: ${newHash.slice(0, 8)}...)`,
  );
}

/**
 * Bring every Protocol row into conformance with the strict v8 schema the app
 * applies on read.
 *
 * Two classes of protocol need work:
 * - schemaVersion < 8: migrated up to v8 (hard-fails the deploy on error, since
 *   the new interview module cannot read pre-v8 data at all).
 * - schemaVersion 8 but non-conformant: schema 8 was never released, so these
 *   are invalid dev-era rows (e.g. still carrying pre-v8 field shapes) that
 *   are mechanically re-normalized through the v7→v8 migration. If a
 *   protocol's content is genuinely invalid and cannot be migrated, it is
 *   logged and left in place — the read path degrades gracefully rather than
 *   crashing, so one bad protocol must not abort the deploy.
 *
 * Idempotent: conformant v8 protocols are skipped.
 */
export async function migrateProtocolsToV8(
  prisma: Prisma.TransactionClient,
): Promise<void> {
  const protocols = await prisma.protocol.findMany({
    where: { schemaVersion: { lte: 8 } },
    select: {
      id: true,
      name: true,
      schemaVersion: true,
      stages: true,
      codebook: true,
      experiments: true,
      assets: {
        select: { assetId: true, name: true, type: true, value: true },
      },
    },
  });

  let migrated = 0;
  let normalized = 0;
  let skipped = 0;

  for (const row of protocols) {
    if (row.schemaVersion < 8) {
      await migrateOneProtocol(prisma, row);
      migrated += 1;
      continue;
    }

    if (isConformantV8(row)) {
      continue;
    }

    try {
      await normalizeMislabelledV8(prisma, row);
      normalized += 1;
    } catch (err) {
      skipped += 1;
      const cause = err instanceof Error ? err.message : String(err);
      console.warn(
        `Could not normalize protocol "${row.name}" (id=${row.id}): ${cause}. ` +
          `Leaving it in place; the read path will fall back for this protocol.`,
      );
    }
  }

  console.log(
    `Protocol migration complete: ${migrated} migrated from <v8, ` +
      `${normalized} non-conformant v8 normalized, ${skipped} left in place.`,
  );
}
