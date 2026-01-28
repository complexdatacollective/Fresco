import { test, expect } from '../../fixtures/test.js';
import {
  waitForTable,
  searchTable,
  selectAllRows,
  getTableRowCount,
  clickSortColumn,
} from '../../helpers/table.js';
import { getFirstRow, openRowActions } from '../../helpers/row-actions.js';
import { confirmDeletion, waitForDialog } from '../../helpers/dialog.js';

test.describe('Protocols Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/protocols');
  });

  test.describe('Read-only', () => {
    test('displays page heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Protocols' }).first(),
      ).toBeVisible();
    });

    test('displays subtitle', async ({ page }) => {
      await expect(
        page.getByText(/Upload and manage your interview protocols/),
      ).toBeVisible();
    });

    test('displays protocols table', async ({ page }) => {
      await waitForTable(page);
      await expect(page.locator('table')).toBeVisible();
    });

    test('shows import button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /import protocols/i }),
      ).toBeVisible();
    });

    test('displays protocol rows', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      const count = await getTableRowCount(page);
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('shows Test Protocol in table', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await expect(page.getByText('Test Protocol')).toBeVisible();
    });

    test('search protocols by name', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await searchTable(page, 'Test Protocol');
      const count = await getTableRowCount(page);
      expect(count).toBe(1);
    });

    test('search with no results', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await searchTable(page, 'nonexistent protocol xyz');
      await expect(
        page.getByText(/no.*result|no.*found|no.*data/i),
      ).toBeVisible();
    });

    test('sort by name', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await clickSortColumn(page, 'Name');
    });

    test('row actions dropdown opens', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      const row = getFirstRow(page);
      await openRowActions(row);
      await expect(page.getByRole('menuitem').first()).toBeVisible();
    });

    test('bulk selection toggle', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await selectAllRows(page);
      const headerCheckbox = page.locator('thead').getByRole('checkbox');
      await expect(headerCheckbox).toBeChecked();
    });

    test('visual snapshot', async ({ page, visual }) => {
      await waitForTable(page, { minRows: 1 });
      await visual();
      await expect(page).toHaveScreenshot('protocols-page.png', {
        fullPage: true,
      });
    });
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('delete single protocol via row actions', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 1 });
        const initialCount = await getTableRowCount(page);

        const row = getFirstRow(page);
        await openRowActions(row);
        await page.getByRole('menuitem', { name: /delete/i }).click();

        const dialog = await waitForDialog(page);
        await expect(dialog).toContainText(/delete/i);
        await confirmDeletion(page);

        await page.waitForTimeout(1000);
        const newCount = await getTableRowCount(page);
        expect(newCount).toBe(initialCount - 1);
      } finally {
        await cleanup();
      }
    });

    test('visual: delete confirmation dialog', async ({
      page,
      database,
      visual,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 1 });

        const row = getFirstRow(page);
        await openRowActions(row);
        await page.getByRole('menuitem', { name: /delete/i }).click();

        const dialog = await waitForDialog(page);
        await visual();
        await expect(dialog).toHaveScreenshot(
          'protocols-delete-confirmation.png',
        );
      } finally {
        await cleanup();
      }
    });

    test('bulk delete protocols', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 1 });
        await selectAllRows(page);

        const deleteButton = page.getByRole('button', { name: /delete/i });
        await deleteButton.click();

        await confirmDeletion(page);
        await page.waitForTimeout(1000);

        const count = await getTableRowCount(page);
        expect(count).toBe(0);
      } finally {
        await cleanup();
      }
    });

    test('visual: empty state after deleting all', async ({
      page,
      database,
      visual,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 1 });
        await selectAllRows(page);

        const deleteButton = page.getByRole('button', { name: /delete/i });
        await deleteButton.click();
        await confirmDeletion(page);
        await page.waitForTimeout(1000);

        await visual();
        await expect(page).toHaveScreenshot('protocols-empty-state.png', {
          fullPage: true,
        });
      } finally {
        await cleanup();
      }
    });
  });
});
