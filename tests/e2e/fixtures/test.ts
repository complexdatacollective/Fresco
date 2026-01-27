import { test as base, expect } from '@playwright/test';
import { DatabaseIsolation } from './db-fixture.js';
import { loadContext, type SuiteContext } from '../helpers/context.js';

type TestFixtures = {
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

export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  database: async ({}, use, testInfo) => {
    const suiteId = resolveSuiteFromPath(testInfo.file);
    const context = await getContext(suiteId);
    const db = new DatabaseIsolation(context.databaseUrl, suiteId);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(db);
  },
});

export { expect };
