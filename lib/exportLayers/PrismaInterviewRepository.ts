import { Effect, Layer } from 'effect';
import { DatabaseError, getUserMessage } from '~/lib/network-exporters/errors';
import { InterviewRepository } from '~/lib/network-exporters/services/InterviewRepository';
import { getInterviewsForExport } from '~/queries/interviews';

export const PrismaInterviewRepository = Layer.succeed(InterviewRepository, {
  getForExport: (ids) =>
    Effect.tryPromise({
      try: () => getInterviewsForExport(ids),
      catch: (error) =>
        new DatabaseError({
          cause: error,
          userMessage: getUserMessage(
            error,
            'fetching interviews from database',
          ),
        }),
    }),
});
