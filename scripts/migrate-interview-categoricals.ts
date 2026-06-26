/* eslint-disable no-console */
import {
  type Codebook,
  CodebookSchema,
  type Variable,
} from '@codaco/protocol-validation';
import {
  type NcNetwork,
  NcNetworkSchema,
  type VariableValue,
} from '@codaco/shared-consts';
import { type PrismaClient } from '~/lib/db/generated/client';

/**
 * `@codaco/interview` >= 1.1.0 stores categorical attribute values as arrays of
 * selected option values (a single selection is a one-element array). Networks
 * collected by earlier versions may hold a bare scalar (written by CategoricalBin),
 * which the new package's array-only readers no longer match. This migration wraps
 * those scalars in single-element arrays. See Fresco#795.
 */

function categoricalVariableIds(
  variables: Record<string, Variable> | undefined,
): Set<string> {
  const ids = new Set<string>();
  if (!variables) return ids;
  for (const [id, variable] of Object.entries(variables)) {
    if (variable.type === 'categorical') ids.add(id);
  }
  return ids;
}

/**
 * Wrap any scalar value held by a categorical variable in a single-element array.
 * Already-array values, unanswered (`null`/`undefined`) values, and the `{x, y}`
 * layout object are left untouched, so the transform is idempotent.
 */
function wrapEntityCategoricals(
  attributes: Record<string, VariableValue>,
  categoricalIds: Set<string>,
): boolean {
  let changed = false;
  for (const id of categoricalIds) {
    if (!Object.prototype.hasOwnProperty.call(attributes, id)) continue;
    const value = attributes[id];
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) continue;
    if (typeof value === 'object') continue;
    attributes[id] = [value];
    changed = true;
  }
  return changed;
}

/**
 * Convert scalar categorical attribute values to single-element arrays across a
 * single interview network, resolving categorical variables from the protocol
 * codebook. Mutates and returns the passed network; `changed` reports whether any
 * value was rewritten.
 */
export function migrateNetworkCategoricals(
  network: NcNetwork,
  codebook: Codebook,
): { network: NcNetwork; changed: boolean } {
  let changed = false;

  for (const node of network.nodes) {
    const ids = categoricalVariableIds(codebook.node?.[node.type]?.variables);
    if (ids.size > 0 && wrapEntityCategoricals(node.attributes, ids)) {
      changed = true;
    }
  }

  for (const edge of network.edges) {
    const ids = categoricalVariableIds(codebook.edge?.[edge.type]?.variables);
    if (ids.size > 0 && wrapEntityCategoricals(edge.attributes, ids)) {
      changed = true;
    }
  }

  const egoIds = categoricalVariableIds(codebook.ego?.variables);
  if (
    egoIds.size > 0 &&
    wrapEntityCategoricals(network.ego.attributes, egoIds)
  ) {
    changed = true;
  }

  return { network, changed };
}

const BATCH_SIZE = 200;

/**
 * Migrate scalar categorical attribute values to single-element arrays across all
 * stored interview networks.
 *
 * Idempotent: networks already on the array contract are read but not rewritten.
 * Codebooks are parsed once per protocol and cached. An interview whose network or
 * codebook fails to parse is logged and skipped rather than aborting the run, so a
 * single malformed row can't block a deploy.
 */
export async function migrateInterviewCategoricals(
  prisma: PrismaClient,
): Promise<void> {
  const codebookCache = new Map<string, Codebook | null>();

  const getCodebook = (protocolId: string, raw: unknown): Codebook | null => {
    const cached = codebookCache.get(protocolId);
    if (cached !== undefined) return cached;

    const result = CodebookSchema.safeParse(raw);
    const codebook = result.success ? result.data : null;
    if (!codebook) {
      console.warn(
        `Skipping interviews for protocol ${protocolId}: codebook failed to parse.`,
      );
    }
    codebookCache.set(protocolId, codebook);
    return codebook;
  };

  let cursor: string | undefined;
  let scanned = 0;
  let migrated = 0;
  let skipped = 0;

  for (;;) {
    const batch = await prisma.interview.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: {
        id: true,
        network: true,
        protocolId: true,
        protocol: { select: { codebook: true } },
      },
    });

    if (batch.length === 0) break;

    for (const row of batch) {
      scanned++;

      const codebook = getCodebook(row.protocolId, row.protocol.codebook);
      if (!codebook) {
        skipped++;
        continue;
      }

      const parsedNetwork = NcNetworkSchema.safeParse(row.network);
      if (!parsedNetwork.success) {
        console.warn(`Skipping interview ${row.id}: network failed to parse.`);
        skipped++;
        continue;
      }

      const { network, changed } = migrateNetworkCategoricals(
        parsedNetwork.data,
        codebook,
      );

      if (changed) {
        await prisma.interview.update({
          where: { id: row.id },
          data: { network },
        });
        migrated++;
      }
    }

    cursor = batch[batch.length - 1]?.id;
    if (batch.length < BATCH_SIZE) break;
  }

  if (scanned === 0) {
    console.log('No interviews to scan for categorical migration.');
    return;
  }

  console.log(
    `Categorical migration: scanned ${scanned} interviews, ` +
      `rewrote ${migrated}, skipped ${skipped}.`,
  );
}
