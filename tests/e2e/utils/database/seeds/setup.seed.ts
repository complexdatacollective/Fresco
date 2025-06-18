import {
  cleanDatabase,
  resetDatabaseToInitialState,
} from '~/tests/e2e/utils/database/cleanup';
import { prisma } from '~/utils/db';

/**
 * Seed database for setup/onboarding testing (minimal setup)
 */
export const seedSetupData = async () => {
  await cleanDatabase();

  // Don't add the 'configured' setting to simulate first-time setup
  await prisma.appSettings.createMany({
    data: [{ key: 'disableAnalytics', value: 'true' }],
    skipDuplicates: true,
  });

  return {
    isInitialSetup: true,
  };
};

/**
 * Seed database for testing setup completion
 */
export const seedCompletedSetupData = async () => {
  await resetDatabaseToInitialState();

  // Add UploadThing configuration
  await prisma.appSettings.createMany({
    data: [{ key: 'uploadThingToken', value: 'test-uploadthing-token' }],
    skipDuplicates: true,
  });

  return {
    isSetupComplete: true,
  };
};
