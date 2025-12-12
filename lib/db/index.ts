import { PrismaClient } from '~/lib/db/generated/client';
import { env } from '~/env';
import { createPrismaAdapter } from './adapter';

const createPrismaClient = () => {
  const adapter = createPrismaAdapter(
    env.DATABASE_URL,
    env.USE_NEON_POSTGRES_ADAPTER,
  );

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
