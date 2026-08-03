import { NcNetworkSchema } from '@codaco/shared-consts';
import { Effect, Layer } from 'effect';
import { DatabaseError } from '@codaco/network-exporters/errors';
import { type InterviewExportInput } from '@codaco/network-exporters/input';
import { InterviewRepository } from '@codaco/network-exporters/services/InterviewRepository';
import { getInterviewsForExport } from '~/queries/interviews';

export const PrismaInterviewRepository = Layer.succeed(InterviewRepository, {
  getForExport: (ids) =>
    Effect.gen(function* () {
      const rows = yield* Effect.tryPromise({
        try: () => getInterviewsForExport([...ids]),
        catch: (error) => new DatabaseError({ cause: error }),
      });

      const inputs: InterviewExportInput[] = rows.map((row) => ({
        id: row.id,
        participantIdentifier:
          row.participant.label && row.participant.label !== ''
            ? row.participant.label
            : row.participant.identifier,
        startTime: row.startTime,
        finishTime: row.finishTime,
        network: NcNetworkSchema.parse(row.network),
        protocolHash: row.protocol.hash,
      }));

      return inputs;
    }),
});
