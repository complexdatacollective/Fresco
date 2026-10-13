import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';

import { env } from '~/env';
import { PrismaClient } from '~/lib/db/generated/client';

const createPrismaClient = () => {
  const adapter = env.USE_NEON_POSTGRES_ADAPTER
    ? new PrismaNeon({ connectionString: env.DATABASE_URL })
    : new PrismaPg({ connectionString: env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends({
    /**
     * JSON columns are deliberately not parsed here. A fallback in place of a
     * row that does not parse would hand every reader an empty stand-in: an
     * interview started without the participant's answers (which its first
     * sync then overwrites), or one run against an empty protocol. Each reader
     * parses the columns it uses (`parseStoredInterviewSession`,
     * `parseStoredProtocol`, or `CodebookSchema` where only the codebook is
     * read) and, when that fails, refuses to go on or goes without that data;
     * none substitutes an empty stand-in.
     */
    query: {
      appSettings: {
        async findUnique({ args, query }) {
          // Only intercept queries with a key
          if (!args.where?.key) {
            return query(args);
          }

          const key = args.where.key;
          const result = await query(args);

          // Return the raw value or null if no result
          // The query layer will handle parsing to proper types
          return {
            key,
            value: result?.value ?? null,
          };
        },
      },
    },
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
