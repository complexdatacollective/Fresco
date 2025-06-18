import { test as base } from '@playwright/test';
import { cleanDatabase as cleanDatabaseUtil } from '~/tests/e2e/utils/database/cleanup';
import {
  seedBasicData,
  seedCompletedSetupData,
  seedDashboardData,
  seedSetupData,
} from '~/tests/e2e/utils/database/seeds';
import { prisma } from '~/utils/db';

export type DatabaseFixtures = {
  cleanDatabase: () => Promise<void>;
  basicData: any;
  dashboardData: any;
  setupData: any;
  completedSetupData: any;
  db: typeof prisma;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const test = base.extend<DatabaseFixtures>({
  // Clean database before each test
  cleanDatabase: async ({}, use) => {
    const cleanDB = async () => {
      await cleanDatabaseUtil();
    };

    await cleanDB(); // Clean before test
    await use(cleanDB);
    // Note: We don't clean after test to allow debugging failed tests
  },

  // Provide direct database access
  db: async ({}, use) => {
    await use(prisma);
  },

  // Provide clean database with basic test data
  basicData: async ({ cleanDatabase }: any, use: any) => {
    await cleanDatabase();
    const data = await seedBasicData();
    await use(data);
  },

  // Provide database seeded for dashboard testing
  dashboardData: async ({ cleanDatabase }: any, use: any) => {
    await cleanDatabase();
    const data = await seedDashboardData();
    await use(data);
  },

  // Provide database for setup/onboarding testing
  setupData: async ({ cleanDatabase }: any, use: any) => {
    await cleanDatabase();
    const data = await seedSetupData();
    await use(data);
  },

  // Provide database with completed setup
  completedSetupData: async ({ cleanDatabase }: any, use: any) => {
    await cleanDatabase();
    const data = await seedCompletedSetupData();
    await use(data);
  },
});

// Export expect from playwright/test
export { expect } from '@playwright/test';
