import { test as base, type Page } from '@playwright/test';
import { ContextResolver } from './context-resolver';
import { DatabaseSnapshots } from './database-snapshots';
import { VisualSnapshots } from './visual-snapshots';

/**
 * Extended test fixtures for Fresco e2e tests
 */
export type TestFixtures = {
  /** Visual snapshot utilities for the current page */
  snapshots: VisualSnapshots;
  /** Authenticated page with admin credentials */
  authenticatedPage: Page;
  /** Database snapshot operations for test isolation */
  database: DatabaseSnapshots;
};

/**
 * Extended test with visual snapshots, authentication, and database fixtures
 */
export const test = base.extend<TestFixtures>({
  // Visual snapshots fixture - automatically available in every test
  snapshots: async ({ page }, run) => {
    const snapshots = new VisualSnapshots(page);
    await run(snapshots);
  },

  // Authenticated page fixture - creates a page with stored auth state
  authenticatedPage: async ({ browser }, run) => {
    // Path to stored auth state from setup
    const authFile = 'tests/e2e/.auth/admin.json';

    // Create a new context with the stored auth state
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();

    await run(page);

    await context.close();
  },

  // Database snapshots fixture - provides database isolation capabilities
  database: async (_, run, testInfo) => {
    // Resolve the appropriate test environment context automatically
    const context = ContextResolver.resolveContext(testInfo);

    if (!context) {
      const contextInfo = ContextResolver.getContextInfo(testInfo);
      throw new Error(
        `No test environment context available. Ensure global setup has run.\n` +
          `Available contexts: ${contextInfo.availableContexts.join(', ')}\n` +
          `Test file: ${testInfo.file}\n` +
          `Project: ${testInfo.project.name}`,
      );
    }

    const database = new DatabaseSnapshots(context, testInfo);
    await run(database);
  },
});

// Re-export expect from Playwright
export { expect } from '@playwright/test';

// Re-export visual snapshot configurations for convenience
export { SNAPSHOT_CONFIGS } from './visual-snapshots';
