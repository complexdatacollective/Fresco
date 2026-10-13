import { z } from 'zod/mini';

import {
  CodebookSchema,
  ExperimentsSchema,
  stageSchema,
} from '@codaco/protocol-validation';

const StoredProtocolSchema = z.object({
  stages: z.array(stageSchema),
  codebook: CodebookSchema,
  experiments: ExperimentsSchema,
});

/**
 * Parse the design a protocol row holds: its stages, codebook and experiments.
 *
 * There is deliberately no fallback. A row that does not parse still holds the
 * researcher's design; substituting an empty one would run interviews that
 * collect nothing and exports that drop every variable. Every caller must
 * refuse to go on instead.
 *
 * Each field is validated against its own schema rather than the
 * whole-protocol `CurrentProtocolSchema`, which cross-references the asset
 * manifest. Fresco stores assets in their own table, and that cross-reference
 * already ran when the protocol was imported.
 */
export function parseStoredProtocol(row: {
  stages: unknown;
  codebook: unknown;
  experiments: unknown;
}) {
  return StoredProtocolSchema.safeParse({
    stages: row.stages,
    codebook: row.codebook,
    // A protocol that enables no experiments stores none.
    experiments: row.experiments ?? {},
  });
}
