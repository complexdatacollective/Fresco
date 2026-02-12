import { expect, test } from '../../fixtures/test.js';
import { confirmDeletion, waitForDialog } from '../../helpers/dialog.js';
import { getFirstRow, openRowActions } from '../../helpers/row-actions.js';
import {
  clearSearch,
  clickSortColumn,
  getTableRowCount,
  searchTable,
  selectAllRows,
  waitForTable,
} from '../../helpers/table.js';

test.describe('Participants Page', () => {
  // Acquire shared lock and restore database - protects read-only tests from
  // concurrent mutations in other workers
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants');
  });

  test.describe('Read-only', () => {
    // Release shared lock after read-only tests complete, before mutations start.
    // This reduces wait time for mutation tests that need exclusive locks.
    test.afterAll(async ({ database }) => {
      await database.releaseReadLock();
    });

    test('displays page heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Participants', level: 1 }),
      ).toBeVisible();
    });

    test('displays page header', async ({ page }) => {
      await expect(page.getByTestId('participants-page-header')).toBeVisible();
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
      const headerCheckbox = page
        .getByTestId('data-table')
        .locator('thead')
        .getByRole('checkbox');
      await expect(headerCheckbox).toBeChecked();
      await selectAllRows(page);
      await expect(headerCheckbox).not.toBeChecked();
    });

    test('import participants button visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
    });

    test('visual snapshot', async ({ page, capturePage }) => {
      await waitForTable(page, { minRows: 10 });
      await capturePage('participants-page');
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

    test('add new participant', async ({ page }) => {
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
      await expect(page.getByRole('cell', { name: 'P011' })).toBeVisible();
    });

    test('visual: add participant dialog', async ({ page, captureElement }) => {
      await page.getByRole('button', { name: /add/i }).click();
      const dialog = await waitForDialog(page);

      await captureElement(dialog, 'participants-add-dialog');
    });

    test('delete participant via row actions', async ({ page }) => {
      await waitForTable(page, { minRows: 10 });
      const initialCount = await getTableRowCount(page);

      const row = getFirstRow(page);
      await openRowActions(row);
      await page.getByRole('menuitem', { name: /delete/i }).click();
      await confirmDeletion(page);

      const newCount = await getTableRowCount(page);
      expect(newCount).toBe(initialCount - 1);
    });

    test('delete all participants', async ({ page }) => {
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

      const count = await getTableRowCount(page);
      expect(count).toBe(0);
    });

    test('visual: empty state', async ({ page, capturePage }) => {
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

      await capturePage('participants-empty-state');
    });
  });
});
