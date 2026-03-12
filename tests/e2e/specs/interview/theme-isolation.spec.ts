import { expect, expectURL, test } from '../../fixtures/test.js';

/**
 * Tests for interview theme isolation.
 *
 * Verifies that interview CSS theme is properly applied when entering
 * interview routes and properly removed when navigating away.
 *
 * The theme activates via :root:has([data-interview]) in CSS, where
 * data-interview is a server-rendered attribute on the interview layout's
 * <main> element. When React unmounts the interview layout, the attribute
 * leaves the DOM and the CSS stops matching.
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

        // Verify interview layout's <main data-interview> is present
        await expect(page.locator('main[data-interview]')).toBeVisible();

        // Navigate away from interview routes (signin is outside the (interview) route group)
        await page.goto('/signin');
        await expectURL(page, /\/signin/);

        // Verify interview layout is unmounted
        await expect(page.locator('main[data-interview]')).not.toBeAttached();
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
        await expect(page.locator('main[data-interview]')).toBeVisible();

        // Navigate within interview (e.g., to a different step via URL)
        await page.goto(`/preview/${protocolId}/interview?step=1`);

        // Verify theme is still applied
        await expect(page.locator('main[data-interview]')).toBeVisible();
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

        // Verify no interview layout present initially
        await expect(page.locator('main[data-interview]')).not.toBeAttached();

        // Navigate to interview
        await page.goto(`/preview/${protocolId}/interview`);
        await expectURL(page, new RegExp(`/preview/${protocolId}/interview`));

        // Verify theme is applied
        await expect(page.locator('main[data-interview]')).toBeVisible();

        // Use browser back button
        await page.goBack();
        await expectURL(page, /\/signin/);

        // Verify interview layout is unmounted after back navigation
        await expect(page.locator('main[data-interview]')).not.toBeAttached();
      } finally {
        await cleanup();
      }
    });
  });
});
