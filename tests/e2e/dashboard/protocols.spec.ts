import { expect, test } from '@playwright/test';
import { DashboardHelpers } from '../utils/dashboard-helpers';

test.describe('Dashboard Protocols Page', () => {
  let dashboardHelpers: DashboardHelpers;

  test.beforeEach(async ({ page }) => {
    dashboardHelpers = new DashboardHelpers(page);
    await dashboardHelpers.navigateToProtocols();
  });

  test('should display protocols page', async ({ page }) => {
    // Check page title/heading
    await expect(page.locator('h1')).toContainText(/protocols/i);

    // Check for protocols table or empty state
    const protocolsContainer = page.locator(
      '[data-testid="protocols-container"], main',
    );
    await expect(protocolsContainer).toBeVisible();
  });

  test('should display protocols table when protocols exist', async ({
    page,
  }) => {
    // Check if protocols table exists
    const table = dashboardHelpers.protocolsTable;
    const hasProtocols = (await table.count()) > 0;

    if (hasProtocols) {
      await dashboardHelpers.waitForProtocolsTable();
      await expect(table).toBeVisible();

      // Check for table headers
      const headers = page.locator('th, [role="columnheader"]');
      await expect(headers.first()).toBeVisible();
    } else {
      // Check for empty state
      const emptyState = page.locator(
        '[data-testid="empty-state"], .empty-state',
      );
      await expect(
        emptyState.or(page.getByText(/no protocols/i)),
      ).toBeVisible();
    }
  });

  test('should have protocol upload functionality', async ({ page }) => {
    // Look for upload button or upload area
    const uploadButton = page.locator('button').filter({ 
      hasText: /upload|add|create/i 
    });

    // If no upload button found, check for upload area or file input
    if ((await uploadButton.count()) === 0) {
      const uploadArea = page.locator(
        '[data-testid="upload-area"], .upload-area, input[type="file"]'
      );
      
      if ((await uploadArea.count()) > 0) {
        await expect(uploadArea.first()).toBeVisible();
      } else {
        // Skip test if no upload functionality found
        test.skip(true, 'No upload functionality found on protocols page');
      }
    } else {
      await expect(uploadButton.first()).toBeVisible();
    }
  });

  test('visual regression: protocols page', async ({ page }) => {
    await dashboardHelpers.prepareForVisualTesting();

    // Take full page screenshot
    await dashboardHelpers.expectVisualRegression('protocols-page-full');
  });

  test('visual regression: protocols table', async ({ page }) => {
    await dashboardHelpers.waitForProtocolsTable();
    await dashboardHelpers.prepareForVisualTesting();

    // Screenshot the protocols table
    await dashboardHelpers.expectElementVisualRegression(
      '[data-testid="protocols-table"]',
      'protocols-table',
    );
  });

  test('should handle protocol actions menu', async ({ page }) => {
    // First check if protocols table exists
    const table = dashboardHelpers.protocolsTable;
    const hasProtocols = (await table.count()) > 0;

    if (!hasProtocols) {
      test.skip(true, 'No protocols found - skipping action menu test');
      return;
    }

    await dashboardHelpers.waitForProtocolsTable();

    // Look for action buttons in the table
    const actionButton = page
      .locator(
        '[data-testid*="action"], [data-testid*="menu"], button[aria-label*="action"]',
      )
      .first();

    const actionButtonExists = (await actionButton.count()) > 0;

    if (!actionButtonExists) {
      test.skip(true, 'No protocol action buttons found - skipping test');
      return;
    }

    await actionButton.click();

    // Check that menu appears
    const menu = page.locator('[role="menu"], .dropdown-menu');
    await expect(menu).toBeVisible();

    // Check for common actions
    const menuItems = page.locator('[role="menuitem"], .menu-item');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('responsive design: mobile protocols view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await dashboardHelpers.navigateToProtocols();
    await dashboardHelpers.prepareForVisualTesting();

    await dashboardHelpers.expectVisualRegression('protocols-page-mobile');
  });
});
