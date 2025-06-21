import { prisma } from '~/utils/db';

/**
 * Call the cache invalidation API to clear Next.js cache
 */
const invalidateCache = async (tags?: string[]) => {
  // eslint-disable-next-line no-process-env
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';

  try {
    const response = await fetch(`${baseURL}/api/test/database-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'invalidateCache', tags }),
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      // eslint-disable-next-line no-console
      console.warn(
        `Cache invalidation failed: ${error.error ?? 'Unknown error'}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.warn('Cache invalidation API failed:', errorMessage);
    return false;
  }
};

/**
 * Clean all data from the test database with proper cache invalidation
 * This should be called before each test to ensure isolation
 */
export const cleanDatabase = async (
  options: { seed: boolean } = { seed: true },
) => {
  try {
    // Use transactions to avoid deadlocks and ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete in reverse dependency order to avoid foreign key constraints
      await tx.interview.deleteMany();
      await tx.participant.deleteMany();
      await tx.protocol.deleteMany();
      await tx.asset.deleteMany();
      await tx.session.deleteMany();
      await tx.key.deleteMany();
      await tx.user.deleteMany();
      await tx.events.deleteMany();
      // Clean app settings to ensure fresh state
      await tx.appSettings.deleteMany();
    });

    // Invalidate caches after database cleanup
    await invalidateCache();

    if (options.seed) {
      await prisma.appSettings.createMany({
        data: [
          { key: 'configured', value: 'true' },
          { key: 'initializedAt', value: new Date().toISOString() },
          { key: 'disableAnalytics', value: 'true' }, // Disable analytics in tests
          { key: 'uploadThingToken', value: 'test-uploadthing-token' }, // Example token
        ],
        skipDuplicates: true,
      });
    } else {
      // Even if we don't seed, we need to set initializedAt, since the production app
      // has this set during deployment
      await prisma.appSettings.create({
        data: {
          key: 'initializedAt',
          value: new Date().toISOString(),
        },
      });
    }

    // eslint-disable-next-line no-console
    console.log('Database cleanup completed with cache invalidation');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error('Database cleanup failed:', errorMessage);

    // Fallback to TRUNCATE if the transaction approach fails
    try {
      const tablenames = await prisma.$queryRaw<
        { tablename: string }[]
      >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

      const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"public"."${name}"`)
        .join(', ');

      if (tables) {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`,
        );
      }

      // Try to invalidate cache even after fallback
      await invalidateCache();
      // eslint-disable-next-line no-console
      console.log('TRUNCATE fallback completed with cache invalidation');
    } catch (fallbackError) {
      const fallbackErrorMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError);
      // eslint-disable-next-line no-console
      console.error('All cleanup methods failed:', fallbackErrorMessage);
      throw fallbackError;
    }
  }
};
