import { test as base, expect } from '@playwright/test';
import { getContext, getSuiteId } from '../helpers/context.js';
import { TestDatabase } from '../helpers/TestDatabase.js';
import { AppFixture } from './app-fixture.js';

/**
 * Test fixtures for API-only tests.
 *
 * These tests run in the 'api' environment which has:
 * - A configured app with seeded data (same as dashboard)
 * - No authentication storageState
 * - Uses Playwright's built-in `request` fixture for API calls
 *
 * The database fixture provides snapshot restoration for mutation tests.
 */

type WorkerFixtures = {
  database: TestDatabase;
  app: AppFixture;
};

export const test = base.extend<object, WorkerFixtures>({
  database: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      const projectName = workerInfo.project.name;
      const suiteId = getSuiteId(projectName);
      const context = await getContext(suiteId);
      const db = TestDatabase.fromConnectionUri(context.databaseUrl, suiteId);
      await use(db);
    },
    { scope: 'worker' },
  ],

  app: [
    async ({ database }, use) => {
      const app = new AppFixture(database.prisma);
      await use(app);
    },
    { scope: 'worker' },
  ],
});

export { expect };
