import { Effect, Layer } from 'effect';

import { DatabaseError } from '@codaco/network-exporters/errors';
import { type ProtocolExportInput } from '@codaco/network-exporters/input';
import { ProtocolRepository } from '@codaco/network-exporters/services/ProtocolRepository';
import { CodebookSchema } from '@codaco/protocol-validation';
import { prisma } from '~/lib/db';

export const PrismaProtocolRepository = Layer.succeed(ProtocolRepository, {
  getProtocols: (hashes) =>
    Effect.gen(function* () {
      const rows = yield* Effect.tryPromise({
        try: () =>
          prisma.protocol.findMany({
            where: { hash: { in: [...hashes] } },
          }),
        catch: (error) => new DatabaseError({ cause: error }),
      });

      const result: Record<string, ProtocolExportInput> = {};
      for (const row of rows) {
        // An export is labelled and typed by its codebook. One that does not
        // parse fails the export rather than writing out every variable
        // unlabelled, and it fails as a typed error: the batch route reports
        // and closes the stream only for those.
        const codebook = CodebookSchema.safeParse(row.codebook);
        if (!codebook.success) {
          return yield* new DatabaseError({
            cause: new Error(
              'A protocol selected for export holds data that could not be read',
              { cause: codebook.error },
            ),
          });
        }

        result[row.hash] = {
          hash: row.hash,
          name: row.name,
          codebook: codebook.data,
        };
      }
      return result;
    }),
});
