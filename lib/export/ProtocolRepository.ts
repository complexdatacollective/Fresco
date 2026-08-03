import { CodebookSchema } from '@codaco/protocol-validation';
import { Effect, Layer } from 'effect';
import { DatabaseError } from '@codaco/network-exporters/errors';
import { type ProtocolExportInput } from '@codaco/network-exporters/input';
import { ProtocolRepository } from '@codaco/network-exporters/services/ProtocolRepository';
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
        result[row.hash] = {
          hash: row.hash,
          name: row.name,
          codebook: CodebookSchema.parse(row.codebook),
        };
      }
      return result;
    }),
});
