import { test as base } from '@playwright/test';
import {
  type DashboardSeedData,
  seedBasicData,
  seedCompletedSetupData,
  seedDashboardData,
  seedSetupData,
} from '~/tests/e2e/utils/database/seeds';
import type { BasicSeedData } from '~/tests/e2e/utils/database/seeds/basic.seed';
import { prisma } from '~/utils/db';
import { cleanDatabase as cleanDatabaseUtil } from '../utils/database/cleanup';

export type DatabaseFixtures = {
  cleanDatabase: () => Promise<void>;
  basicData: BasicSeedData;
  dashboardData: DashboardSeedData;
  setupData: {
    isInitialSetup: boolean;
  };
  completedSetupData: {
    isSetupComplete: boolean;
  };
  db: typeof prisma;
};

export const test = base.extend<DatabaseFixtures>({
  // Clean database before each test
  cleanDatabase: async ({}, consume) => {
    const cleanDB = async () => {
      await cleanDatabaseUtil();
    };

    await cleanDB(); // Clean before test
    await consume(cleanDB);
    // Note: We don't clean after test to allow debugging failed tests
  },

  // Provide direct database access
  db: async ({}, consume) => {
    await consume(prisma);
  },

  // Provide clean database with basic test data
  basicData: async ({ cleanDatabase }, consume) => {
    await cleanDatabase();
    const data = await seedBasicData();
    await consume(data);
  },

  // Provide database seeded for dashboard testing
  dashboardData: async ({ cleanDatabase }, consume) => {
    await cleanDatabase();
    const data = await seedDashboardData();
    await consume(data);
  },

  // Provide database for setup/onboarding testing
  setupData: async ({ cleanDatabase }, consume) => {
    await cleanDatabase();
    const data = await seedSetupData();
    await consume(data);
  },

  // Provide database with completed setup
  completedSetupData: async ({ cleanDatabase }, consume) => {
    await cleanDatabase();
    const data = await seedCompletedSetupData();
    await consume(data);
  },
});

// Export expect from playwright/test
export { expect } from '@playwright/test';
