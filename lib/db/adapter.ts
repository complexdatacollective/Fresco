import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaNeon } from '@prisma/adapter-neon';

/**
 * Creates the appropriate Prisma adapter based on the USE_NEON_POSTGRES_ADAPTER
 * environment variable.
 *
 * - When USE_NEON_POSTGRES_ADAPTER is true: Uses the Neon serverless adapter
 *   (recommended for Vercel/Netlify deployments with Neon PostgreSQL)
 * - When USE_NEON_POSTGRES_ADAPTER is false (default): Uses the standard pg adapter
 *   (recommended for Docker deployments with standard PostgreSQL)
 *
 * @param connectionString - The database connection URL
 * @param useNeonAdapter - Whether to use the Neon serverless adapter
 * @returns The appropriate Prisma adapter instance
 */
export function createPrismaAdapter(
  connectionString: string,
  useNeonAdapter: boolean,
) {
  if (useNeonAdapter) {
    return new PrismaNeon({ connectionString });
  }

  return new PrismaPg({ connectionString });
}
