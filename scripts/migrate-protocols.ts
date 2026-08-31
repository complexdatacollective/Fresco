/* eslint-disable no-console */
import { COMPATIBLE_PROTOCOL_SCHEMA_VERSION } from '@codaco/interview/protocol-schema-version';
import {
  CurrentProtocolSchema,
  hashProtocol,
  migrateProtocol,
} from '@codaco/protocol-validation';
import { Prisma } from '~/lib/db/generated/client';

/**
 * The version every stored protocol is brought up to: whatever the embedded
 * `@codaco/interview` runtime can execute. Nothing in this script names a
 * schema version directly, so a bump of that constant moves the whole deploy
 * migration with it.
 */
const TARGET_SCHEMA_VERSION = COMPATIBLE_PROTOCOL_SCHEMA_VERSION;

/**
 * The version the non-conformant-row normalization below re-migrates *from*.
 * Deliberately pinned rather than derived: it identifies the migration chain
 * whose transforms mechanically coerce the legacy field shapes those rows
 * carry, and it is the oldest version this deployment accepts at all.
 */
const NORMALIZATION_SOURCE_VERSION = 7;

type ProtocolAssetRow = {
  assetId: string;
  name: string;
  type: string;
  value: string | null;
};

/**
 * Rebuild a protocol's `assetManifest` from its linked Asset rows. Fresco stores
 * assets in a separate table rather than inline on the protocol, but whole-protocol
 * validation resolves NameGeneratorRoster/Geospatial asset references against the
 * manifest, so it must be present for migration to validate. The manifest is
 * excluded from the protocol hash, so reconstructing it here does not affect the
 * computed hash.
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
function isConformant(row: ProtocolRow): boolean {
  return CurrentProtocolSchema.safeParse({
    name: row.name.replace(/\.netcanvas$/i, ''),
    schemaVersion: TARGET_SCHEMA_VERSION,
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
 * Persist a migrated protocol, detecting a unique-hash collision BEFORE the
 * write and raising an actionable error naming both rows.
 *
 * The pre-check is load-bearing, not an optimization: everything here runs
 * inside setup-database's single PostgreSQL transaction, and a constraint
 * violation (P2002) would mark that whole transaction failed — every
 * subsequent statement, including a per-row tolerance catch and any later
 * data migration, then errors with "current transaction is aborted". Only a
 * check that avoids raising the violation lets a collision be tolerated. The
 * loop is single-threaded within the transaction, so the check is exact.
 */
async function writeMigratedProtocol(
  prisma: Prisma.TransactionClient,
  row: ProtocolRow,
  data: Prisma.ProtocolUpdateInput,
  newHash: string,
): Promise<void> {
  const collider = await prisma.protocol.findFirst({
    where: { hash: newHash, NOT: { id: row.id } },
    select: { id: true, name: true },
  });
  if (collider) {
    throw new Error(
      `Hash collision migrating "${row.name}" (id=${row.id}): ` +
        `migrated hash ${newHash} already exists on protocol "${collider.name}" (id=${collider.id})`,
    );
  }
  await prisma.protocol.update({ where: { id: row.id }, data });
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
    // Once the target version advances beyond 8, version-8 rows enter this
    // path carrying experiments; a source that omitted them would persist the
    // migration's absent default and silently erase the stored configuration.
    // Omit the key (rather than sending null) for the older rows that have
    // none.
    ...(row.experiments != null ? { experiments: row.experiments } : {}),
    assetManifest: buildAssetManifest(row.assets),
  };

  let migrated: ReturnType<typeof migrateProtocol>;
  try {
    migrated = migrateProtocol(reconstructed, TARGET_SCHEMA_VERSION, {
      name: cleanName,
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to migrate protocol "${row.name}" (id=${row.id}): ${cause}`,
      { cause: err },
    );
  }
  const newHash = hashProtocol(migrated);

  await writeMigratedProtocol(
    prisma,
    row,
    {
      schemaVersion: TARGET_SCHEMA_VERSION,
      // Branded EntityAttributeReference fields are compile-time-only; erase
      // the brand at the Prisma JSON boundary.
      stages: migrated.stages as Prisma.InputJsonValue,
      codebook: migrated.codebook,
      // Fall back to the stored value like the normalization path below: the
      // migration chain predates experiments and may not carry them through.
      // A future migration that means to clear them should set `{}`, not drop
      // the key.
      experiments: migrated.experiments ?? row.experiments ?? Prisma.JsonNull,
      hash: newHash,
    },
    newHash,
  );

  console.log(
    `Migrated "${row.name}" (id=${row.id})... ok (new hash: ${newHash.slice(0, 8)}...)`,
  );
}

/**
 * Normalize a protocol already stored at the target version whose body fails
 * the strict read-time schema.
 *
 * This is a one-time cleanup for rows persisted before the current validation
 * rules shipped: they were written when the stored shape was accepted, and
 * still carry field shapes the migration chain mechanically rewrites (for
 * example object-form `automaticLayout`, or `iconVariant` in place of `icon`).
 * Re-running the migration from `NORMALIZATION_SOURCE_VERSION` applies exactly
 * those rewrites; it does not repair content, so a row whose body genuinely
 * violates the schema throws here and is left in place by the caller.
 */
async function normalizeNonConformantProtocol(
  prisma: Prisma.TransactionClient,
  row: ProtocolRow,
): Promise<void> {
  const cleanName = row.name.replace(/\.netcanvas$/i, '');

  const asSourceVersion = {
    name: cleanName,
    schemaVersion: NORMALIZATION_SOURCE_VERSION,
    stages: row.stages,
    codebook: row.codebook,
    assetManifest: buildAssetManifest(row.assets),
  };

  const migrated = migrateProtocol(asSourceVersion, TARGET_SCHEMA_VERSION, {
    name: cleanName,
  });

  // The hash is derived from stages + codebook only, so re-normalizing gives
  // the same hash the import flow would now compute for this protocol.
  const newHash = hashProtocol(migrated);

  await writeMigratedProtocol(
    prisma,
    row,
    {
      schemaVersion: TARGET_SCHEMA_VERSION,
      stages: migrated.stages as Prisma.InputJsonValue,
      codebook: migrated.codebook,
      // Preserve the protocol's existing experiments; a migration chain
      // starting below the version that introduced them has no knowledge of
      // them and would otherwise reset them to its default.
      experiments: row.experiments ?? Prisma.JsonNull,
      hash: newHash,
    },
    newHash,
  );

  console.log(
    `Normalized non-conformant protocol "${row.name}" (id=${row.id})... ok (new hash: ${newHash.slice(0, 8)}...)`,
  );
}

/**
 * Bring every Protocol row up to `TARGET_SCHEMA_VERSION` and into conformance
 * with the strict schema the app applies on read.
 *
 * Two classes of protocol need work:
 * - below the target version: migrated up to it.
 * - at the target version but non-conformant: rows persisted before the
 *   current validation rules shipped, mechanically re-normalized through the
 *   migration chain (see `normalizeNonConformantProtocol`).
 *
 * Both classes tolerate failure: a protocol that cannot be migrated or
 * normalized is logged and left in place, because one bad row must never
 * block a customer's deployment. A left-behind below-target row is safe at
 * runtime — the interview payload refuses a protocol whose stored version
 * does not match the runtime's — and a left-behind non-conformant row
 * degrades gracefully through the read path's per-field parsing.
 *
 * Idempotent: conformant protocols at the target version are skipped.
 */
export async function migrateProtocolsToCompatibleVersion(
  prisma: Prisma.TransactionClient,
): Promise<void> {
  const protocols = await prisma.protocol.findMany({
    where: { schemaVersion: { lte: TARGET_SCHEMA_VERSION } },
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
    if (row.schemaVersion < TARGET_SCHEMA_VERSION) {
      // Tolerated, never deploy-fatal: rows stored under an older, more
      // permissive validator can legitimately fail the corrected rules (the
      // released CEGRM disease color is a real example), and one such row must
      // not block a customer's upgrade. A row left behind is safe at runtime —
      // the interview payload refuses a protocol whose stored version does not
      // match the runtime's, so its interviews report the mismatch instead of
      // running incorrectly.
      try {
        await migrateOneProtocol(prisma, row);
        migrated += 1;
      } catch (err) {
        skipped += 1;
        const cause = err instanceof Error ? err.message : String(err);
        console.error(
          `Could not migrate protocol "${row.name}" (id=${row.id}) from ` +
            `schema version ${row.schemaVersion}: ${cause}. Leaving it in ` +
            `place; interviews using it will refuse to start until it is ` +
            `repaired in Architect and uploaded again.`,
        );
      }
      continue;
    }

    if (isConformant(row)) {
      continue;
    }

    try {
      await normalizeNonConformantProtocol(prisma, row);
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
    `Protocol migration complete: ${migrated} migrated up to schema version ` +
      `${TARGET_SCHEMA_VERSION}, ${normalized} non-conformant normalized, ` +
      `${skipped} left in place.`,
  );
}
