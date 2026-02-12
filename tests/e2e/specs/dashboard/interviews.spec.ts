import { expect, test } from '../../fixtures/test.js';
import { confirmDeletion, waitForDialog } from '../../helpers/dialog.js';
import { getFirstRow, openRowActions } from '../../helpers/row-actions.js';
import {
  clickSortColumn,
  getTableRowCount,
  searchTable,
  selectAllRows,
  waitForTable,
} from '../../helpers/table.js';

test.describe('Interviews Page', () => {
  // Acquire shared lock and restore database - protects read-only tests from
  // concurrent mutations in other workers
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/interviews');
  });

  test.describe('Read-only', () => {
    // Release shared lock after read-only tests complete, before mutations start.
    // This reduces wait time for mutation tests that need exclusive locks.
    test.afterAll(async ({ database }) => {
      await database.releaseReadLock();
    });

    test('displays page heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Interviews', level: 1 }),
      ).toBeVisible();
    });

    test('displays page header', async ({ page }) => {
      await expect(page.getByTestId('interviews-page-header')).toBeVisible();
    });

    test('displays correct number of interviews', async ({ page }) => {
      await waitForTable(page, { minRows: 5 });
      const count = await getTableRowCount(page);
      expect(count).toBe(5);
    });

    test('search by participant', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await searchTable(page, 'P001');
      const count = await getTableRowCount(page);
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('sort by column', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await clickSortColumn(page, 'Started');
    });

    test('export dropdown visible', async ({ page }) => {
      await expect(page.getByTestId('export-interviews-button')).toBeVisible();
    });

    test('bulk selection', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await selectAllRows(page);
      const headerCheckbox = page
        .getByTestId('data-table')
        .locator('thead')
        .getByRole('checkbox');
      await expect(headerCheckbox).toBeChecked();
    });

    test('shows export status badges', async ({ page }) => {
      await waitForTable(page, { minRows: 5 });
      await expect(
        page.getByRole('cell', { name: /not exported/i }).first(),
      ).toBeVisible();
    });

    test('visual snapshot', async ({ page, capturePage }) => {
      await waitForTable(page, { minRows: 5 });
      await capturePage('interviews-page');
    });
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });
    let cleanup: () => Promise<void>;

    test.beforeEach(async ({ page, database }) => {
      cleanup = await database.isolate(page);
    });

    test.afterEach(async () => {
      await cleanup();
    });

    test('delete single interview', async ({ page }) => {
      await waitForTable(page, { minRows: 5 });
      const initialCount = await getTableRowCount(page);

      const row = getFirstRow(page);
      await openRowActions(row);
      await page.getByRole('menuitem', { name: /delete/i }).click();
      await confirmDeletion(page);

      await page.waitForTimeout(1000);
      const newCount = await getTableRowCount(page);
      expect(newCount).toBe(initialCount - 1);
    });

    test('visual: delete confirmation dialog', async ({
      page,
      captureElement,
    }) => {
      await waitForTable(page, { minRows: 1 });

      const row = getFirstRow(page);
      await openRowActions(row);
      await page.getByRole('menuitem', { name: /delete/i }).click();

      const dialog = await waitForDialog(page);
      await captureElement(dialog, 'interviews-delete-confirmation');
    });

    test('bulk delete interviews', async ({ page }) => {
      await waitForTable(page, { minRows: 5 });
      await selectAllRows(page);

      const deleteButton = page.getByRole('button', { name: /delete/i });
      await deleteButton.click();
      await confirmDeletion(page);

      await page.waitForTimeout(1000);
      const count = await getTableRowCount(page);
      expect(count).toBe(0);
    });

    test('visual: export dialog', async ({ page, captureElement }) => {
      await waitForTable(page, { minRows: 1 });

      await page.getByTestId('export-interviews-button').click();
      await page
        .getByRole('menuitem', { name: /export all interviews/i })
        .click();

      const dialog = await waitForDialog(page);
      await captureElement(dialog, 'interviews-export-dialog');
    });
  });
});
