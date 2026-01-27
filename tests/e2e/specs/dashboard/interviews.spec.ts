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

test.describe('Interviews Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/interviews');
  });

  test.describe('Read-only', () => {
    test('displays page heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Interviews' }).first(),
      ).toBeVisible();
    });

    test('displays subtitle', async ({ page }) => {
      await expect(
        page.getByText(/View and manage your interview data/),
      ).toBeVisible();
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
      await expect(
        page.getByRole('button', { name: /export/i }).first(),
      ).toBeVisible();
    });

    test('bulk selection', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await selectAllRows(page);
      const headerCheckbox = page.locator('thead').getByRole('checkbox');
      await expect(headerCheckbox).toBeChecked();
    });

    test('shows export status badges', async ({ page }) => {
      await waitForTable(page, { minRows: 5 });
      await expect(page.getByText('Not exported').first()).toBeVisible();
    });

    test('visual snapshot', async ({ page }) => {
      await waitForTable(page, { minRows: 5 });
      await page.addStyleTag({
        content:
          '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
      });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('interviews-page.png', {
        fullPage: true,
      });
    });
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('delete single interview', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 5 });
        const initialCount = await getTableRowCount(page);

        const row = getFirstRow(page);
        await openRowActions(row);
        await page.getByRole('menuitem', { name: /delete/i }).click();
        await confirmDeletion(page);

        await page.waitForTimeout(1000);
        const newCount = await getTableRowCount(page);
        expect(newCount).toBe(initialCount - 1);
      } finally {
        await cleanup();
      }
    });

    test('visual: delete confirmation dialog', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 1 });

        const row = getFirstRow(page);
        await openRowActions(row);
        await page.getByRole('menuitem', { name: /delete/i }).click();

        const dialog = await waitForDialog(page);
        await page.addStyleTag({
          content:
            '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
        });
        await page.waitForTimeout(500);
        await expect(dialog).toHaveScreenshot(
          'interviews-delete-confirmation.png',
        );
      } finally {
        await cleanup();
      }
    });

    test('bulk delete interviews', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 5 });
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

    test('visual: export dialog', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 1 });

        await page
          .getByRole('button', { name: /export/i })
          .first()
          .click();

        await page.addStyleTag({
          content:
            '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
        });
        await page.waitForTimeout(500);
        await expect(page).toHaveScreenshot('interviews-export-dialog.png');
      } finally {
        await cleanup();
      }
    });
  });
});
