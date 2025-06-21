import { prisma } from '~/utils/db';

/**
 * Seed database for setup/onboarding testing (minimal setup)
 */
export const seedSetupData = async () => {
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
  // Add UploadThing configuration
  await prisma.appSettings.createMany({
    data: [{ key: 'uploadThingToken', value: 'test-uploadthing-token' }],
    skipDuplicates: true,
  });

  return {
    isSetupComplete: true,
  };
};
