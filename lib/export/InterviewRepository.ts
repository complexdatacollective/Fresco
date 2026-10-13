import { Effect, Layer } from 'effect';

import { DatabaseError } from '@codaco/network-exporters/errors';
import { type InterviewExportInput } from '@codaco/network-exporters/input';
import { InterviewRepository } from '@codaco/network-exporters/services/InterviewRepository';
import { NcNetworkSchema } from '@codaco/shared-consts';
import { getInterviewsForExport } from '~/queries/interviews';

export const PrismaInterviewRepository = Layer.succeed(InterviewRepository, {
  getForExport: (ids) =>
    Effect.gen(function* () {
      const rows = yield* Effect.tryPromise({
        try: () => getInterviewsForExport([...ids]),
        catch: (error) => new DatabaseError({ cause: error }),
      });

      const inputs: InterviewExportInput[] = [];
      for (const row of rows) {
        // An export must hold what the interview holds. A network that does not
        // parse fails the export rather than being written out as an empty one,
        // and it fails as a typed error: the batch route reports and closes the
        // stream only for those. The message carries no interview id, because
        // the report leaves the deployment.
        const network = NcNetworkSchema.safeParse(row.network);
        if (!network.success) {
          return yield* new DatabaseError({
            cause: new Error(
              'An interview selected for export holds data that could not be read',
              { cause: network.error },
            ),
          });
        }

        inputs.push({
          id: row.id,
          // Always the stable identifier, never the optional human-readable
          // label: this becomes the case ID in the exported CSV/GraphML, and it
          // must match the identifier used by recruitment URLs and participant
          // rows. Labels are neither unique nor stable, so using one here would
          // make cases ambiguous across an export.
          participantIdentifier: row.participant.identifier,
          startTime: row.startTime,
          finishTime: row.finishTime,
          network: network.data,
          protocolHash: row.protocol.hash,
        });
      }

      return inputs;
    }),
});
