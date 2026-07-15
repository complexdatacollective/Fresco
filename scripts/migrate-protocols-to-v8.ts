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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Copy the original `validation.required` state back onto migrated variables.
 * The v7→v8 migration adds `required: true` to any variable carrying a min*
 * rule without an explicit `required`, because pre-v8 runtimes coupled the
 * two. Fresco's legacy form engine only actually coupled `minLength` and
 * `minSelected` (an empty value failed those validators); `minValue` passed
 * empty values, so a min-valued variable without `required` behaved as
 * optional. Restore the stored state exactly where it matches the behaviour
 * participants observed: explicit `required` values are always restored, and
 * the migration-added `required: true` is removed only when the variable's
 * min validators are limited to `minValue`.
 */
function restoreRequiredFlags(origVars: unknown, candVars: unknown): void {
  if (!isRecord(origVars) || !isRecord(candVars)) return;

  for (const [varId, candVar] of Object.entries(candVars)) {
    const origVar = origVars[varId];
    if (!isRecord(origVar) || !isRecord(candVar)) continue;

    const origValidation = origVar.validation;
    const candValidation = candVar.validation;
    if (!isRecord(origValidation) || !isRecord(candValidation)) continue;

    if ('required' in origValidation) {
      candValidation.required = origValidation.required;
    } else if (
      !('minLength' in origValidation) &&
      !('minSelected' in origValidation)
    ) {
      delete candValidation.required;
    }
  }
}

/**
 * Re-running the v7→v8 migration on a body that is already v8-authored is not
 * idempotent: it unconditionally resets every node type's `shape` config to
 * `{ default: 'circle' }` and adds `required: true` next to min* validators.
 * On a mislabelled-v8 row those are authored v8 values, not legacy shapes, so
 * copy them back from the stored codebook. Original values are only restored
 * where they are structurally plausible (object shape configs, existing
 * validation objects); the caller re-parses the result against the strict
 * schema before persisting, so a bad restoration can never be written.
 */
function restoreAuthoredV8State(
  origCodebook: Record<string, unknown>,
  candCodebook: Record<string, unknown>,
): void {
  for (const entity of ['node', 'edge'] as const) {
    const origEntity = origCodebook[entity];
    const candEntity = candCodebook[entity];
    if (!isRecord(origEntity) || !isRecord(candEntity)) continue;

    for (const [typeId, candType] of Object.entries(candEntity)) {
      const origType = origEntity[typeId];
      if (!isRecord(origType) || !isRecord(candType)) continue;

      if (entity === 'node' && isRecord(origType.shape)) {
        candType.shape = origType.shape;
      }

      restoreRequiredFlags(origType.variables, candType.variables);
    }
  }

  const origEgo = origCodebook.ego;
  const candEgo = candCodebook.ego;
  if (isRecord(origEgo) && isRecord(candEgo)) {
    restoreRequiredFlags(origEgo.variables, candEgo.variables);
  }
}

/**
 * Normalize a protocol stored as schemaVersion 8 whose body fails the strict
 * read-time schema — either because it still carries pre-v8 field shapes
 * (e.g. object-form `automaticLayout`) or because it was imported under a
 * laxer historical validator (e.g. out-of-palette OrdinalBin colors or an
 * orphaned CategoricalBin `otherOptionLabel`, both tightened in
 * protocol-validation 11.9.0). Re-running the v7→v8 migration rewrites those
 * shapes; authored v8-only state the re-migration would destroy (node shape
 * configs, optional-field semantics, `experiments`) is preserved from the
 * stored row. Throws if the content is genuinely invalid and cannot be
 * migrated.
 */
async function normalizeMislabelledV8(
  prisma: Prisma.TransactionClient,
  row: ProtocolRow,
): Promise<void> {
  const cleanName = row.name.replace(/\.netcanvas$/i, '');

  // migrateProtocol shares nested objects with its input and mutates some of
  // them in place (e.g. setting `required` on a variable's validation), so
  // snapshot the stored codebook before migrating to keep a true original.
  const origCodebook: unknown = structuredClone(row.codebook);

  const asV7 = {
    name: cleanName,
    schemaVersion: 7,
    stages: row.stages,
    codebook: row.codebook,
    assetManifest: buildAssetManifest(row.assets),
  };

  const migrated = migrateProtocol(asV7, 8, { name: cleanName });

  // Restore authored v8 state onto a clone of the migration output, then keep
  // the restored body only if it still satisfies the strict schema.
  let finalProtocol: Pick<typeof migrated, 'stages' | 'codebook'> = migrated;
  const candidate: unknown = structuredClone(migrated);
  if (
    isRecord(candidate) &&
    isRecord(candidate.codebook) &&
    isRecord(origCodebook)
  ) {
    restoreAuthoredV8State(origCodebook, candidate.codebook);

    const reparsed = CurrentProtocolSchema.safeParse({
      name: cleanName,
      schemaVersion: 8,
      stages: candidate.stages,
      codebook: candidate.codebook,
      experiments: row.experiments ?? {},
      // Required for asset-referencing stages; without it the restored body
      // would always fail this parse and needlessly discard authored state.
      assetManifest: buildAssetManifest(row.assets),
    });

    if (reparsed.success) {
      finalProtocol = reparsed.data;
    } else {
      console.warn(
        `Could not preserve authored v8 state while normalizing "${row.name}" ` +
          `(id=${row.id}); persisting the plain re-migration output instead.`,
      );
    }
  }

  // The hash is derived from stages + codebook only, so re-normalizing to v8
  // gives the same hash the import flow would now compute for this protocol.
  const newHash = hashProtocol({ ...migrated, ...finalProtocol });

  await writeMigratedProtocol(
    prisma,
    row,
    {
      schemaVersion: 8,
      stages: finalProtocol.stages as Prisma.InputJsonValue,
      codebook: finalProtocol.codebook,
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
 * - schemaVersion 8 but non-conformant: imported under a laxer historical
 *   validator, these are labelled v8 while still carrying pre-v8 field shapes.
 *   They are re-normalized. If a protocol's content is genuinely invalid and
 *   cannot be migrated, it is logged and left in place — the read path degrades
 *   gracefully rather than crashing, so one bad protocol must not abort the deploy.
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
