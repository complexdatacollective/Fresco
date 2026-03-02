import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '~/lib/db/generated/client.js';

export type TestPrismaClient = InstanceType<typeof PrismaClient>;

export function createTestPrisma(connectionUri: string): TestPrismaClient {
  const adapter = new PrismaPg({ connectionString: connectionUri });
  return new PrismaClient({ adapter });
}
