import { expect, expectURL, test } from '../../fixtures/test.js';

/**
 * Tests for interview theme isolation.
 *
 * Verifies that interview CSS theme is properly applied when entering
 * interview routes and properly removed when navigating away.
 *
 * This prevents the bug where interview styles "bleed" into the dashboard
 * after navigating back from an interview.
 */
test.describe('Interview Theme Isolation', () => {
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('interview theme is applied on entry and removed on exit', async ({
      page,
      database,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);
        const protocolId = await database.createPreviewProtocol();

        // Navigate to preview interview
        await page.goto(`/preview/${protocolId}/interview`);
        await expectURL(page, new RegExp(`/preview/${protocolId}/interview`));

        // Verify interview theme is applied to <html>
        const htmlElement = page.locator('html');
        await expect(htmlElement).toHaveAttribute('data-theme', 'interview');

        // Navigate away from interview routes (signin is outside the (interview) route group)
        await page.goto('/signin');
        await expectURL(page, /\/signin/);

        // Verify interview theme is removed from <html>
        await expect(htmlElement).not.toHaveAttribute('data-theme', 'interview');
      } finally {
        await cleanup();
      }
    });

    test('interview theme persists across interview navigation', async ({
      page,
      database,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);
        const protocolId = await database.createPreviewProtocol();

        // Navigate to preview interview
        await page.goto(`/preview/${protocolId}/interview`);
        await expectURL(page, new RegExp(`/preview/${protocolId}/interview`));

        // Verify interview theme is applied
        const htmlElement = page.locator('html');
        await expect(htmlElement).toHaveAttribute('data-theme', 'interview');

        // Navigate within interview (e.g., to a different step via URL)
        await page.goto(`/preview/${protocolId}/interview?step=1`);

        // Verify theme is still applied
        await expect(htmlElement).toHaveAttribute('data-theme', 'interview');
      } finally {
        await cleanup();
      }
    });

    test('browser back navigation removes interview theme', async ({
      page,
      database,
    }, testInfo) => {
      const cleanup = await database.isolate(page, testInfo);
      try {
        await database.enablePreviewMode(false);
        const protocolId = await database.createPreviewProtocol();

        // Start at a non-interview page (signin is outside (interview) route group)
        await page.goto('/signin');
        await expectURL(page, /\/signin/);

        // Verify no theme attribute initially
        const htmlElement = page.locator('html');
        await expect(htmlElement).not.toHaveAttribute('data-theme', 'interview');

        // Navigate to interview
        await page.goto(`/preview/${protocolId}/interview`);
        await expectURL(page, new RegExp(`/preview/${protocolId}/interview`));

        // Verify theme is applied
        await expect(htmlElement).toHaveAttribute('data-theme', 'interview');

        // Use browser back button
        await page.goBack();
        await expectURL(page, /\/signin/);

        // Verify theme is removed after back navigation
        await expect(htmlElement).not.toHaveAttribute('data-theme', 'interview');
      } finally {
        await cleanup();
      }
    });
  });
});
