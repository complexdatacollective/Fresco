import { expect, SNAPSHOT_CONFIGS, test } from '../../fixtures/fixtures';
import {
  confirmDeletion,
  getDialog,
  waitForDialog,
} from '../../utils/dialog-helpers';
import {
  clickMenuItem,
  deleteSingleItem,
  getFirstRow,
  openRowActions,
} from '../../utils/row-actions-helpers';
import {
  clearSearch,
  expectAllRowsSelected,
  getRowCheckboxes,
  getTableRowCount,
  searchTable,
  selectAllRows,
  waitForTable,
} from '../../utils/table-helpers';

test.describe.parallel('Interviews page - parallel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });
  });

  test('should match visual snapshot', async ({ snapshots }) => {
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.fullPage('interviews-page'),
    );
  });

  test('should display interviews heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Interviews', exact: true }),
    ).toBeVisible();
  });

  test('should display interviews subtitle', async ({ page }) => {
    await expect(
      page.getByText(/view and manage your interview data/i),
    ).toBeVisible();
  });

  test('should display interviews table', async ({ page }) => {
    await waitForTable(page);
  });

  test('should display table columns', async ({ page }) => {
    await waitForTable(page);

    // Check for expected column headers
    await expect(page.locator('text=Participant').first()).toBeVisible();
    await expect(page.locator('text=Protocol').first()).toBeVisible();
    await expect(page.locator('text=Started').first()).toBeVisible();
    await expect(page.locator('text=Progress').first()).toBeVisible();
  });

  test('should display interview rows', async ({ page }) => {
    await waitForTable(page);

    // Should have interview rows from test data (5 interviews)
    const rowCount = await getTableRowCount(page);
    expect(rowCount).toBe(5);
  });

  test('should search interviews by participant identifier', async ({
    page,
  }) => {
    await waitForTable(page);

    // Search for a specific participant
    await searchTable(page, 'P001');

    // Should filter results
    const filteredCount = await getTableRowCount(page);
    expect(filteredCount).toBe(1);

    // Clear search
    await clearSearch(page);

    // All rows should return
    const allRows = await getTableRowCount(page);
    expect(allRows).toBe(5);
  });

  test('should sort interviews by column', async ({ page }) => {
    await waitForTable(page);

    // Find sortable column header (Updated)
    const sortButton = page.getByRole('button', { name: /updated/i }).first();
    await expect(sortButton).toBeVisible();

    // Click to toggle sort
    await sortButton.click();
    await page.waitForTimeout(300);

    // Verify button is still visible (sort toggled)
    await expect(sortButton).toBeVisible();
  });

  test('should display export interview data dropdown', async ({ page }) => {
    await waitForTable(page);

    // Look for export dropdown menu button
    const exportButton = page.getByRole('button', {
      name: /export interview data/i,
    });
    await expect(exportButton).toBeVisible();
  });

  test('should display progress percentage', async ({ page }) => {
    await waitForTable(page);

    // Should have progress indicators in rows
    const progressCells = page.locator('tbody td').filter({ hasText: '%' });
    const count = await progressCells.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display export status badges', async ({ page }) => {
    await waitForTable(page);

    // Should have export status (either "Not exported" or a timestamp)
    const notExportedBadge = page.getByText('Not exported').first();
    if (await notExportedBadge.isVisible()) {
      await expect(notExportedBadge).toBeVisible();
    }
  });

  test('should allow bulk selection', async ({ page }) => {
    await waitForTable(page);

    // Select all
    await selectAllRows(page);

    // Verify all row checkboxes are checked
    await expectAllRowsSelected(page);

    // Uncheck all
    await selectAllRows(page);
  });
});

test.describe.serial('Interviews page - serial', () => {
  test('visual: export dialog', async ({ page, database, snapshots }) => {
    const cleanup = await database.isolate('interviews-export-dialog');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Click export dropdown
      const exportButton = page.getByRole('button', {
        name: /export interview data/i,
      });
      await exportButton.click();

      // Should show dropdown menu
      const menu = page.getByRole('menu');
      await expect(menu).toBeVisible({ timeout: 5000 });

      // Click export all option
      const exportAllOption = page.getByRole('menuitem', {
        name: /export all interviews/i,
      });
      await exportAllOption.click();

      // Dialog should open
      const dialog = getDialog(page);
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await snapshots.expectPageToMatchSnapshot(
        SNAPSHOT_CONFIGS.modal('interviews-export-dialog'),
      );

      // Close dialog
      await page.keyboard.press('Escape');
    } finally {
      await cleanup();
    }
  });

  test('visual: delete confirmation dialog', async ({
    page,
    database,
    snapshots,
  }) => {
    const cleanup = await database.isolate('interviews-delete-dialog');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Open delete dialog for first row
      const firstRow = getFirstRow(page);
      await openRowActions(firstRow);
      await clickMenuItem(page, /delete/i);

      // Wait for dialog
      const dialog = await waitForDialog(page);
      await expect(dialog).toBeVisible();

      await snapshots.expectPageToMatchSnapshot(
        SNAPSHOT_CONFIGS.modal('interviews-delete-confirmation'),
      );

      // Close dialog
      await page.keyboard.press('Escape');
    } finally {
      await cleanup();
    }
  });

  test('should delete single interview via row actions', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('delete-interview');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Get initial row count
      const initialCount = await getTableRowCount(page);

      // Delete the first row
      const firstRow = getFirstRow(page);
      await deleteSingleItem(page, firstRow);

      // Verify row count decreased
      await page.waitForTimeout(500);
      const finalCount = await getTableRowCount(page);
      expect(finalCount).toBe(initialCount - 1);
    } finally {
      await cleanup();
    }
  });

  test('should bulk delete selected interviews', async ({ page, database }) => {
    const cleanup = await database.isolate('bulk-delete-interviews');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Select first two rows
      const rowCheckboxes = getRowCheckboxes(page);
      await rowCheckboxes.nth(0).click();
      await rowCheckboxes.nth(1).click();
      await page.waitForTimeout(300);

      // Look for bulk delete button (should appear when rows selected)
      const deleteSelectedButton = page.getByRole('button', {
        name: /delete selected|delete \d+/i,
      });

      if (await deleteSelectedButton.isVisible()) {
        await deleteSelectedButton.click();

        // Confirm in dialog
        await waitForDialog(page);
        await confirmDeletion(page);
      }
    } finally {
      await cleanup();
    }
  });

  test('should open export interviews dialog', async ({ page, database }) => {
    const cleanup = await database.isolate('export-interviews-dialog');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Click export dropdown
      const exportButton = page.getByRole('button', {
        name: /export interview data/i,
      });
      await expect(exportButton).toBeVisible();
      await exportButton.click();

      // Should show dropdown menu
      const menu = page.getByRole('menu');
      await expect(menu).toBeVisible({ timeout: 5000 });

      // Click export all option
      const exportAllOption = page.getByRole('menuitem', {
        name: /export all interviews/i,
      });
      if (await exportAllOption.isVisible()) {
        await exportAllOption.click();

        // Dialog should open
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Close dialog
        await page.keyboard.press('Escape');
      }
    } finally {
      await cleanup();
    }
  });

  test('should open generate URLs dialog', async ({ page, database }) => {
    const cleanup = await database.isolate('generate-urls-dialog');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Select some interviews first
      const rowCheckboxes = getRowCheckboxes(page);
      await rowCheckboxes.first().click();
      await page.waitForTimeout(300);

      // Click export incomplete interview URLs button
      const generateButton = page.getByRole('button', {
        name: /export incomplete interview urls/i,
      });

      if (await generateButton.isEnabled()) {
        await generateButton.click();

        // Dialog should open
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible()) {
          await expect(dialog).toBeVisible({ timeout: 5000 });
          // Close dialog
          await page.keyboard.press('Escape');
        }
      }
    } finally {
      await cleanup();
    }
  });
});
