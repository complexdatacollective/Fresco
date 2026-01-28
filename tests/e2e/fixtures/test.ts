import { test as base, expect } from '@playwright/test';
import { loadContext, type SuiteContext } from '../helpers/context.js';
import { DatabaseIsolation } from './db-fixture.js';

type TestFixtures = {
  visual: () => Promise<void>;
};

type WorkerFixtures = {
  database: DatabaseIsolation;
};

function resolveSuiteFromPath(filePath: string): string {
  // specs/setup/*.spec.ts -> setup suite
  if (filePath.includes('/specs/setup/')) return 'setup';
  // specs/auth/*.spec.ts -> dashboard suite (auth uses dashboard env)
  if (filePath.includes('/specs/auth/')) return 'dashboard';
  // specs/dashboard/*.spec.ts -> dashboard suite
  if (filePath.includes('/specs/dashboard/')) return 'dashboard';
  return 'dashboard';
}

let contextCache: Record<string, SuiteContext> | null = null;

async function getContext(suiteId: string): Promise<SuiteContext> {
  if (!contextCache) {
    const stored = await loadContext();
    if (!stored) {
      throw new Error(
        'Test context not found. Did global-setup.ts run successfully?',
      );
    }
    contextCache = stored.suites;
  }

  const suite = contextCache[suiteId];
  if (!suite) {
    throw new Error(
      `Suite "${suiteId}" not found in test context. Available: ${Object.keys(contextCache).join(', ')}`,
    );
  }
  return suite;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  database: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      // Worker-scoped so it can be used in beforeAll hooks
      // Map project name to suite ID
      const projectName = workerInfo.project.name;
      const suiteId = projectName === 'setup' ? 'setup' : 'dashboard';
      const context = await getContext(suiteId);
      const db = new DatabaseIsolation(context.databaseUrl, suiteId);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use(db);
    },
    { scope: 'worker' },
  ],

  visual: [
    async ({ page }, use, testInfo) => {
      // eslint-disable-next-line no-process-env
      if (!process.env.CI) {
        testInfo.skip(true, 'Visual snapshots only run in Docker');
      }
      await use(async () => {
        await page.addStyleTag({
          content:
            '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
        });
      });
    },
    { scope: 'test' },
  ],
});

export { expect };
