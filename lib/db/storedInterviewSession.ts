import { z } from 'zod/mini';

import { NcNetworkSchema, StageMetadataSchema } from '@codaco/shared-consts';

const StoredInterviewSessionSchema = z.object({
  network: NcNetworkSchema,
  stageMetadata: z.nullable(StageMetadataSchema),
});

/**
 * Parse the participant data an interview row holds: its network and its stage
 * metadata.
 *
 * There is deliberately no fallback. A row that does not parse still holds the
 * participant's answers; substituting an empty value would start the interview
 * without them, and the client's first sync would then write that empty state
 * over the stored one. Every caller must refuse to go on instead.
 */
export function parseStoredInterviewSession(row: {
  network: unknown;
  stageMetadata: unknown;
}) {
  return StoredInterviewSessionSchema.safeParse({
    network: row.network,
    stageMetadata: row.stageMetadata,
  });
}
