import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '~/lib/db/generated/prisma/client';
import { env } from '~/env';

const createPrismaClient = () => {
  // Use the pooled connection URL for runtime queries
  const connectionString = env.DATABASE_URL;

  const adapter = new PrismaPg({ connectionString });

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
