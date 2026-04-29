import { CodebookSchema } from '@codaco/protocol-validation';
import { Effect, Layer } from 'effect';
import { DatabaseError } from '~/lib/network-exporters/errors';
import {
  parseNcNetwork,
  type InterviewExportInput,
} from '~/lib/network-exporters/input';
import { InterviewRepository } from '~/lib/network-exporters/services/InterviewRepository';
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
        network: parseNcNetwork(row.network),
        protocol: {
          hash: row.protocol.hash,
          name: row.protocol.name,
          codebook: CodebookSchema.parse(row.protocol.codebook),
        },
      }));

      return inputs;
    }),
});
