import { test as base } from '@playwright/test';
import { DashboardHelpers } from '../utils/dashboard-helpers';
import { TestDataManager } from '../utils/test-data-manager';
import { AuthHelper } from '../utils/auth-helper';

// Extend Playwright's base test with custom fixtures
export const test = base.extend<{
  dashboardHelpers: DashboardHelpers;
  testDataManager: TestDataManager;
  authHelper: AuthHelper;
}>({
  dashboardHelpers: async ({ page }, use) => {
    const helpers = new DashboardHelpers(page);
    await use(helpers);
  },

  testDataManager: async ({ page }, use) => {
    const manager = new TestDataManager(page);
    await use(manager);
    
    // Cleanup after each test
    await manager.cleanup();
    await manager.cleanupTestFiles();
  },

  authHelper: async ({ page }, use) => {
    const auth = new AuthHelper(page);
    await use(auth);
  },
});

export { expect } from '@playwright/test';