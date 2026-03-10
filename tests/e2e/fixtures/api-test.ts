import { test as base, expect } from '@playwright/test';
import { getContextMappings } from '../config/test-config.js';
import { loadContext, type SuiteContext } from '../helpers/context.js';
import { DatabaseIsolation } from './db-fixture.js';

/**
 * Test fixtures for API-only tests.
 *
 * These tests run in the 'api' environment which has:
 * - A configured app with seeded data (same as dashboard)
 * - No authentication storageState
 * - Uses Playwright's built-in `request` fixture for API calls
 *
 * The database fixture provides isolation for mutation tests via isolateApi().
 */

type WorkerFixtures = {
  database: DatabaseIsolation;
};

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

export const test = base.extend<object, WorkerFixtures>({
  database: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      const projectName = workerInfo.project.name;
      const mappings = getContextMappings();
      const suiteId = mappings[projectName];
      if (!suiteId) {
        throw new Error(
          `No context mapping for project "${projectName}". Available: ${Object.keys(mappings).join(', ')}`,
        );
      }
      const context = await getContext(suiteId);
      const db = new DatabaseIsolation(context.databaseUrl, suiteId);

      try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use(db);
      } finally {
        // Always release locks when the worker tears down
        await db.releaseReadLock();
      }
    },
    { scope: 'worker' },
  ],
});

export { expect };
