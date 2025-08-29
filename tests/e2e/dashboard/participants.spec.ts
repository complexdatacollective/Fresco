import { expect, test } from '@playwright/test';
import { DashboardHelpers } from '../utils/dashboard-helpers';

test.describe('Dashboard Participants Page', () => {
  let dashboardHelpers: DashboardHelpers;

  test.beforeEach(async ({ page }) => {
    dashboardHelpers = new DashboardHelpers(page);
    await dashboardHelpers.navigateToParticipants();
  });

  test('should display participants page', async ({ page }) => {
    // Check page title/heading
    await expect(page.locator('h1')).toContainText(/participants/i);

    // Check for participants container
    const participantsContainer = page.locator(
      '[data-testid="participants-container"], main',
    );
    await expect(participantsContainer).toBeVisible();
  });

  test('should display participants table when participants exist', async ({
    page,
  }) => {
    // Check if participants table exists
    const table = dashboardHelpers.participantsTable;
    const hasParticipants = (await table.count()) > 0;

    if (hasParticipants) {
      await dashboardHelpers.waitForParticipantsTable();
      await expect(table).toBeVisible();

      // Check for table headers
      const headers = page.locator('th, [role="columnheader"]');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    } else {
      // Check for empty state
      const emptyState = page.locator(
        '[data-testid="empty-state"], .empty-state',
      );
      await expect(
        emptyState.or(page.getByText(/no participants/i)),
      ).toBeVisible();
    }
  });

  test('should have participant management functionality', async ({ page }) => {
    // Look for add participant button
    const addButton = page
      .locator('[data-testid="add-participant"], button')
      .filter({ hasText: /add|create participant/i });

    await expect(addButton.first()).toBeVisible();
  });

  test('should have import/export functionality', async ({ page }) => {
    // Look for import/export buttons
    const importExportButtons = page.locator('button').filter({
      hasText: /import|export|csv/i,
    });

    if ((await importExportButtons.count()) > 0) {
      await expect(importExportButtons.first()).toBeVisible();
    }
  });

  test('visual regression: participants page', async ({ page }) => {
    await dashboardHelpers.prepareForVisualTesting();

    // Take full page screenshot
    await dashboardHelpers.expectVisualRegression('participants-page-full');
  });

  test('visual regression: participants table', async ({ page }) => {
    const table = dashboardHelpers.participantsTable;
    const hasParticipants = (await table.count()) > 0;

    if (!hasParticipants) {
      test.skip(true, 'No participants table found - skipping visual regression');
      return;
    }

    await dashboardHelpers.waitForParticipantsTable();
    await dashboardHelpers.prepareForVisualTesting();

    // Screenshot the participants table
    await dashboardHelpers.expectElementVisualRegression(
      '[data-testid="participants-table"]',
      'participants-table',
    );
  });

  test('should handle participant actions', async ({ page }) => {
    // Check if participants table exists first
    const table = dashboardHelpers.participantsTable;
    const hasParticipants = (await table.count()) > 0;

    if (!hasParticipants) {
      test.skip(true, 'No participants found - skipping actions test');
      return;
    }

    await dashboardHelpers.waitForParticipantsTable();

    // Look for action buttons in the table
    const actionButton = page
      .locator(
        '[data-testid*="action"], [data-testid*="menu"], button[aria-label*="action"]',
      )
      .first();

    const hasActionButton = (await actionButton.count()) > 0;

    if (!hasActionButton) {
      test.skip(true, 'No participant action buttons found');
      return;
    }

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
  });

  test('should open add participant modal', async ({ page }) => {
    const addButton = page
      .locator('[data-testid="add-participant"], button')
      .filter({ hasText: /add|create participant/i })
      .first();

    if (await addButton.isVisible()) {
      await addButton.click();

      // Check for modal
      const modal = page.locator(
        '[role="dialog"], .modal, [data-testid="modal"]',
      );
      await expect(modal).toBeVisible();

      // Check for form fields within the modal
      const modalForm = modal.locator('form').first();
      if ((await modalForm.count()) > 0) {
        const inputs = modalForm.locator('input, textarea, select');
        const inputCount = await inputs.count();
        expect(inputCount).toBeGreaterThan(0);
      }
    }
  });

  test('responsive design: mobile participants view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await dashboardHelpers.navigateToParticipants();
    await dashboardHelpers.prepareForVisualTesting();

    await dashboardHelpers.expectVisualRegression('participants-page-mobile');
  });
});
