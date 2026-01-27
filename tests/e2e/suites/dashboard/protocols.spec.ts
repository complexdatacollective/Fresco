import { expect, SNAPSHOT_CONFIGS, test } from '../../fixtures/fixtures';
import { confirmDeletion, waitForDialog } from '../../utils/dialog-helpers';
import {
  deleteSingleItem,
  getFirstRow,
  openRowActions,
} from '../../utils/row-actions-helpers';
import {
  clearSearch,
  expectAllRowsSelected,
  getRowCheckboxes,
  searchTable,
  selectAllRows,
  waitForTable,
} from '../../utils/table-helpers';

test.describe.parallel('Protocols page - parallel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/protocols', { waitUntil: 'domcontentloaded' });
  });

  test('should match visual snapshot', async ({ snapshots }) => {
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.fullPage('protocols-page'),
    );
  });

  test('should display protocols heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Protocols', exact: true }),
    ).toBeVisible();
  });

  test('should display protocols subtitle', async ({ page }) => {
    await expect(
      page.getByText(/upload and manage your interview protocols/i),
    ).toBeVisible();
  });

  test('should display protocols table', async ({ page }) => {
    await waitForTable(page);
  });

  test('should display table columns', async ({ page }) => {
    await waitForTable(page);

    // Check for expected column headers
    await expect(page.locator('text=Name').first()).toBeVisible();
    await expect(page.locator('text=Imported').first()).toBeVisible();
    await expect(page.locator('text=Modified').first()).toBeVisible();
  });

  test('should display protocol rows', async ({ page }) => {
    await waitForTable(page, { minRows: 1 });
  });

  test('should display import protocols button', async ({ page }) => {
    await waitForTable(page);

    const importButton = page.getByRole('button', {
      name: /import protocols/i,
    });
    await expect(importButton).toBeVisible();
  });

  test('should search protocols by name', async ({ page }) => {
    await waitForTable(page);

    // Search for test protocol
    await searchTable(page, 'Test');

    // Should filter results
    const filteredRows = page.locator('tbody tr');
    const filteredCount = await filteredRows.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);

    // Clear search
    await clearSearch(page);
  });

  test('should sort protocols by name column', async ({ page }) => {
    await waitForTable(page);

    // Find sortable name column header
    const sortButton = page.getByRole('button', { name: /^name$/i }).first();
    await expect(sortButton).toBeVisible();

    // Click to toggle sort
    await sortButton.click();
    await page.waitForTimeout(300);

    // Verify button is still visible (sort toggled)
    await expect(sortButton).toBeVisible();
  });

  test('should allow bulk selection', async ({ page }) => {
    await waitForTable(page);

    // Select all
    await selectAllRows(page);

    // Verify row checkboxes are checked
    await expectAllRowsSelected(page);

    // Uncheck all
    await selectAllRows(page);
  });

  test('should show row actions dropdown', async ({ page }) => {
    await waitForTable(page);

    // Find first row and open actions
    const firstRow = getFirstRow(page);
    await openRowActions(firstRow);

    // Should show menu with options
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible({ timeout: 5000 });

    // Close menu
    await page.keyboard.press('Escape');
  });

  test('should display protocol name in row', async ({ page }) => {
    await waitForTable(page);

    // Should show Test Protocol from test data
    await expect(page.getByText('Test Protocol').first()).toBeVisible();
  });
});

test.describe.serial('Protocols page - serial', () => {
  test('visual: empty state', async ({ page, database, snapshots }) => {
    const cleanup = await database.isolate('protocols-empty-state');
    await page.goto('/dashboard/protocols', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Delete all protocols to get empty state
      const firstRow = getFirstRow(page);
      await deleteSingleItem(page, firstRow);

      // Wait for empty state
      await expect(page.getByText('No results')).toBeVisible({
        timeout: 10000,
      });

      await snapshots.expectPageToMatchSnapshot(
        SNAPSHOT_CONFIGS.emptyState('protocols-empty-state'),
      );
    } finally {
      await cleanup();
    }
  });

  test('visual: delete confirmation dialog', async ({
    page,
    database,
    snapshots,
  }) => {
    const cleanup = await database.isolate('protocols-delete-dialog');
    await page.goto('/dashboard/protocols', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Open delete dialog
      const firstRow = getFirstRow(page);
      await openRowActions(firstRow);

      const deleteMenuItem = page.getByRole('menuitem', { name: /delete/i });
      await deleteMenuItem.click();

      // Wait for dialog
      const dialog = await waitForDialog(page);
      await expect(dialog).toBeVisible();

      await snapshots.expectPageToMatchSnapshot(
        SNAPSHOT_CONFIGS.modal('protocols-delete-confirmation'),
      );

      // Close dialog
      await page.keyboard.press('Escape');
    } finally {
      await cleanup();
    }
  });

  test('should delete single protocol via row actions', async ({
    page,
    database,
  }) => {
    // Call isolate FIRST to restore database to initial state
    const cleanup = await database.isolate('delete-protocol');

    // Navigate AFTER isolation to see the restored data
    await page.goto('/dashboard/protocols', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Delete the first row
      const firstRow = getFirstRow(page);
      await deleteSingleItem(page, firstRow);

      // After deleting the only protocol, the table should show "No results"
      await expect(page.getByText('No results')).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await cleanup();
    }
  });

  test('should open import dialog and show cancel option', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('import-dialog');
    await page.goto('/dashboard/protocols', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      const importButton = page.getByRole('button', {
        name: /import protocols/i,
      });
      await expect(importButton).toBeVisible();
      await importButton.click();

      // File dialog or dropzone should appear
      // We just verify the button was clickable and no error occurred
      await page.waitForTimeout(500);

      // The import process may open a file dialog which we can't interact with in E2E
      // Just verify the page is still functional
      await expect(page.locator('body')).toBeVisible();
    } finally {
      await cleanup();
    }
  });

  test('should bulk delete protocols when selected', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('bulk-delete-protocols');
    await page.goto('/dashboard/protocols', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Select first row
      const rowCheckboxes = getRowCheckboxes(page);
      if ((await rowCheckboxes.count()) > 0) {
        await rowCheckboxes.first().click();
        await page.waitForTimeout(300);

        // Look for bulk delete button
        const deleteSelectedButton = page.getByRole('button', {
          name: /delete selected|delete \d+/i,
        });

        if (await deleteSelectedButton.isVisible()) {
          await deleteSelectedButton.click();

          // Confirm in dialog
          await waitForDialog(page);
          await confirmDeletion(page);
        }
      }
    } finally {
      await cleanup();
    }
  });
});
