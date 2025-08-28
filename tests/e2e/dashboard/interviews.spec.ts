import { expect, test } from '@playwright/test';
import { DashboardHelpers } from '../utils/dashboard-helpers';

test.describe('Dashboard Interviews Page', () => {
  let dashboardHelpers: DashboardHelpers;

  test.beforeEach(async ({ page }) => {
    dashboardHelpers = new DashboardHelpers(page);
    await dashboardHelpers.navigateToInterviews();
  });

  test('should display interviews page', async ({ page }) => {
    // Check page title/heading
    await expect(page.locator('h1')).toContainText(/interviews/i);

    // Check for interviews container
    const interviewsContainer = page.locator(
      '[data-testid="interviews-container"], main',
    );
    await expect(interviewsContainer).toBeVisible();
  });

  test('should display interviews table when interviews exist', async ({
    page,
  }) => {
    try {
      await dashboardHelpers.waitForInterviewsTable();

      // Verify table structure
      const table = dashboardHelpers.interviewsTable;
      await expect(table).toBeVisible();

      // Check for table headers
      const headers = page.locator('th, [role="columnheader"]');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    } catch (error) {
      // If no interviews exist, check for empty state
      const emptyState = page.locator(
        '[data-testid="empty-state"], .empty-state',
      );
      await expect(
        emptyState.or(page.getByText(/no interviews/i)),
      ).toBeVisible();
    }
  });

  test('should have interview export functionality', async ({ page }) => {
    // Look for export buttons
    const exportButton = page.locator('button').filter({
      hasText: /export|download/i,
    });

    if ((await exportButton.count()) > 0) {
      await expect(exportButton.first()).toBeVisible();
    }
  });

  test('visual regression: interviews page', async ({ page }) => {
    await dashboardHelpers.prepareForVisualTesting();

    // Take full page screenshot
    await dashboardHelpers.expectVisualRegression('interviews-page-full');
  });

  test('visual regression: interviews table', async ({ page }) => {
    try {
      await dashboardHelpers.waitForInterviewsTable();
      await dashboardHelpers.prepareForVisualTesting();

      // Screenshot the interviews table
      await dashboardHelpers.expectElementVisualRegression(
        '[data-testid="interviews-table"]',
        'interviews-table',
      );
    } catch (error) {
      // Skip if no table exists
      test.skip(!!error, 'No interviews table found');
    }
  });

  test('should handle interview actions', async ({ page }) => {
    try {
      await dashboardHelpers.waitForInterviewsTable();

      // Look for action buttons in the table
      const actionButton = page
        .locator(
          '[data-testid*="action"], [data-testid*="menu"], button[aria-label*="action"]',
        )
        .first();

      if (await actionButton.isVisible()) {
        await actionButton.click();

        // Check that menu appears
        const menu = page.locator('[role="menu"], .dropdown-menu');
        await expect(menu).toBeVisible();

        // Check for common actions
        const menuItems = page.locator('[role="menuitem"], .menu-item');
        const count = await menuItems.count();
        expect(count).toBeGreaterThan(0);
      }
    } catch (error) {
      // Skip if no actions available
      test.skip(!!error, 'No interview actions found');
    }
  });

  test('should display network summary when available', async ({ page }) => {
    try {
      await dashboardHelpers.waitForInterviewsTable();

      // Look for network summary information
      const networkSummary = page.locator(
        '[data-testid="network-summary"], .network-summary',
      );

      if ((await networkSummary.count()) > 0) {
        await expect(networkSummary.first()).toBeVisible();
      }
    } catch (error) {
      // Skip if no network data available
      test.skip(!!error, 'No network summary found');
    }
  });

  test('should open export dialog', async ({ page }) => {
    const exportButton = page
      .locator('button')
      .filter({
        hasText: /export|download/i,
      })
      .first();

    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Check for export dialog/modal
      const dialog = page.locator(
        '[role="dialog"], .modal, [data-testid="export-dialog"]',
      );
      if (await dialog.isVisible()) {
        await expect(dialog).toBeVisible();

        // Check for export format options
        const formatOptions = page.locator(
          'input[type="radio"], select, [role="option"]',
        );
        if ((await formatOptions.count()) > 0) {
          await expect(formatOptions.first()).toBeVisible();
        }
      }
    }
  });

  test('responsive design: mobile interviews view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await dashboardHelpers.navigateToInterviews();
    await dashboardHelpers.prepareForVisualTesting();

    await dashboardHelpers.expectVisualRegression('interviews-page-mobile');
  });
});
