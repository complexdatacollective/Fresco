import { expect, test } from '../../fixtures/test.js';
import { waitForDialog } from '../../helpers/dialog.js';
import {
  clearSearch,
  clickSortColumn,
  getTableRowCount,
  searchTable,
  selectAllRows,
  waitForTable,
} from '../../helpers/table.js';

test.describe('Participants Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants');
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

  test('export participation urls popover opens', async ({ page }) => {
    await waitForTable(page, { minRows: 1 });
    const trigger = page.getByTestId('export-participation-urls-button');
    await expect(trigger).toBeVisible();
    await trigger.click();

    const popover = page.getByRole('dialog');
    await expect(popover).toBeVisible();
    await expect(
      popover.getByRole('button', { name: /generate/i }),
    ).toBeVisible();
  });

  test('visual snapshot', async ({ page, capturePage }) => {
    await waitForTable(page, { minRows: 10 });
    await capturePage('participants-page');
  });

  test('visual: add participant dialog', async ({ page, captureElement }) => {
    await page.getByRole('button', { name: /add/i }).click();
    const dialog = await waitForDialog(page);

    await captureElement(dialog, 'participants-add-dialog');
  });
});
