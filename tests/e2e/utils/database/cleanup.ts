import { prisma } from '~/utils/db';

/**
 * Call the cache invalidation API to clear Next.js cache
 */
const invalidateCache = async (tags?: string[]) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${baseURL}/api/test/database-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'invalidateCache', tags }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn(`Cache invalidation failed: ${error.error}`);
      return false;
    }

    const result = await response.json();
    console.log('Cache invalidation:', result.message);
    return true;
  } catch (error) {
    console.warn('Cache invalidation API failed:', error);
    return false;
  }
};

/**
 * Clean all data from the test database with proper cache invalidation
 * This should be called before each test to ensure isolation
 */
export const cleanDatabase = async () => {
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
    await invalidateCache([
      'appSettings',
      'getInterviews',
      'summaryStatistics',
      'getParticipants',
      'getProtocols',
      'getProtocolsByHash',
      'getExistingAssetIds',
      'interviewCount',
      'protocolCount',
      'participantCount',
    ]);

    console.log('Database cleanup completed with cache invalidation');
  } catch (error) {
    console.error('Database cleanup failed:', error);

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
      console.log('TRUNCATE fallback completed with cache invalidation');
    } catch (fallbackError) {
      console.error('All cleanup methods failed:', fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * Clean specific tables (useful for targeted cleanup)
 */
export const cleanTables = async (tableNames: string[]) => {
  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    } catch (error) {
      console.error(`Failed to clean table ${tableName}:`, error);
    }
  }
};

/**
 * Reset database to initial state with basic app settings and proper cache invalidation
 */
export const resetDatabaseToInitialState = async () => {
  console.log('Resetting database to initial state...');
  await cleanDatabase();

  // Add any default app settings that should always exist
  try {
    await prisma.appSettings.createMany({
      data: [
        { key: 'configured', value: 'true' },
        { key: 'initializedAt', value: new Date().toISOString() },
        { key: 'disableAnalytics', value: 'true' }, // Disable analytics in tests
      ],
      skipDuplicates: true,
    });

    // CRITICAL: Invalidate app settings cache after updating
    await invalidateCache([
      'appSettings',
      'appSettings-configured',
      'appSettings-initializedAt',
      'appSettings-disableAnalytics',
    ]);

    console.log('Database reset completed with cache invalidation');
  } catch (error) {
    console.error('Failed to set initial app settings:', error);
    throw error;
  }
};

/**
 * Clean up specific entities by type
 */
export const cleanupEntity = async (
  entityType: 'users' | 'protocols' | 'interviews' | 'participants',
) => {
  switch (entityType) {
    case 'users':
      await prisma.session.deleteMany();
      await prisma.key.deleteMany();
      await prisma.user.deleteMany();
      break;
    case 'protocols':
      await prisma.interview.deleteMany();
      await prisma.protocol.deleteMany();
      break;
    case 'interviews':
      await prisma.interview.deleteMany();
      break;
    case 'participants':
      await prisma.interview.deleteMany();
      await prisma.participant.deleteMany();
      break;
  }
};
