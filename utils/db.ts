import { PrismaClient } from '@prisma/client';
import { env } from '~/env';

const createPrismaClient = () =>
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends({
    query: {
      async $allOperations({ args, query }) {
        if (env.SIMULATE_DELAY) {
          // Add artificial DB delay in development
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return query(args);
      },
    },
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
