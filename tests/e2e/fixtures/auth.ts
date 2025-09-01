import { test as base, type Page } from '@playwright/test';
import * as path from 'path';

// Extend basic test with authentication fixtures
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  // Create an authenticated page that reuses stored auth state
  authenticatedPage: async ({ browser }, run) => {
    // Path to store auth state
    const authFile = path.join(__dirname, '../.auth/admin.json');

    // Create a new context with the stored auth state
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();

    await run(page);

    await context.close();
  },
});

export { expect } from '@playwright/test';
