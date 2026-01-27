import { test, expect } from '../../fixtures/test.js';
import {
  waitForTable,
  searchTable,
  clearSearch,
  selectAllRows,
  getTableRowCount,
  clickSortColumn,
} from '../../helpers/table.js';
import { getFirstRow, openRowActions } from '../../helpers/row-actions.js';
import { confirmDeletion, waitForDialog } from '../../helpers/dialog.js';

test.describe('Participants Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants');
  });

  test.describe('Read-only', () => {
    test('displays page heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Participants' }).first(),
      ).toBeVisible();
    });

    test('displays subtitle', async ({ page }) => {
      await expect(
        page.getByText(/View and manage your participants/),
      ).toBeVisible();
    });

    test('displays participants table with correct row count', async ({
      page,
    }) => {
      await waitForTable(page, { minRows: 10 });
      const count = await getTableRowCount(page);
      expect(count).toBe(10);
    });

    test('search participants', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await searchTable(page, 'P001');
      const count = await getTableRowCount(page);
      expect(count).toBe(1);
    });

    test('clear search restores all rows', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await searchTable(page, 'P001');
      await clearSearch(page);
      const count = await getTableRowCount(page);
      expect(count).toBe(10);
    });

    test('sort by identifier', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await clickSortColumn(page, 'Identifier');
    });

    test('bulk select and deselect', async ({ page }) => {
      await waitForTable(page, { minRows: 1 });
      await selectAllRows(page);
      const headerCheckbox = page.locator('thead').getByRole('checkbox');
      await expect(headerCheckbox).toBeChecked();
      await selectAllRows(page);
      await expect(headerCheckbox).not.toBeChecked();
    });

    test('import participants button visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
    });

    test('visual snapshot', async ({ page }) => {
      await waitForTable(page, { minRows: 10 });
      await page.addStyleTag({
        content:
          '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
      });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('participants-page.png', {
        fullPage: true,
      });
    });
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('add new participant', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 10 });

        await page
          .getByRole('button', { name: /add single participant/i })
          .click();
        const dialog = await waitForDialog(page);

        const identifierInput = dialog.getByLabel(/participant identifier/i);
        await identifierInput.fill('P011');
        const labelInput = dialog.getByLabel(/^label/i);
        await labelInput.fill('New Participant');

        await dialog.getByRole('button', { name: /submit/i }).click();
        await dialog.waitFor({ state: 'hidden' });

        await page.reload();
        await waitForTable(page, { minRows: 1 });
        await searchTable(page, 'P011');
        await expect(page.getByText('P011')).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('visual: add participant dialog', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.getByRole('button', { name: /add/i }).click();
        const dialog = await waitForDialog(page);

        await page.addStyleTag({
          content:
            '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
        });
        await page.waitForTimeout(500);
        await expect(dialog).toHaveScreenshot('participants-add-dialog.png');
      } finally {
        await cleanup();
      }
    });

    test('delete participant via row actions', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 10 });
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

    test('delete all participants', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 10 });

        await page.getByRole('button', { name: /delete all/i }).click();
        // First dialog: confirm "Delete All"
        await page.getByRole('dialog').waitFor({ state: 'visible' });
        await page
          .getByRole('dialog')
          .getByRole('button', { name: /^delete all$/i })
          .click();
        // Second dialog: confirm "Permanently Delete"
        await page
          .getByRole('button', { name: /permanently delete/i })
          .waitFor({ state: 'visible' });
        await page.getByRole('button', { name: /permanently delete/i }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });

        await page.waitForTimeout(1000);
        const count = await getTableRowCount(page);
        expect(count).toBe(0);
      } finally {
        await cleanup();
      }
    });

    test('visual: empty state', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await waitForTable(page, { minRows: 10 });

        await page.getByRole('button', { name: /delete all/i }).click();
        // First dialog: confirm "Delete All"
        await page.getByRole('dialog').waitFor({ state: 'visible' });
        await page
          .getByRole('dialog')
          .getByRole('button', { name: /^delete all$/i })
          .click();
        // Second dialog: confirm "Permanently Delete"
        await page
          .getByRole('button', { name: /permanently delete/i })
          .waitFor({ state: 'visible' });
        await page.getByRole('button', { name: /permanently delete/i }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.waitForTimeout(1000);

        await page.addStyleTag({
          content:
            '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
        });
        await page.waitForTimeout(500);
        await expect(page).toHaveScreenshot('participants-empty-state.png', {
          fullPage: true,
        });
      } finally {
        await cleanup();
      }
    });
  });
});
