import { expect, test } from '../../fixtures/test.js';
import {
  waitForTable,
  searchTable,
  selectAllRows,
  getTableRowCount,
  clickSortColumn,
} from '../../helpers/table.js';
import { getFirstRow, openRowActions } from '../../helpers/row-actions.js';
import { waitForDialog } from '../../helpers/dialog.js';

test.describe('Protocols Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/protocols');
  });

  test('displays page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Protocols', level: 1 }),
    ).toBeVisible();
  });

  test('displays page header', async ({ page }) => {
    await expect(page.getByTestId('protocols-page-header')).toBeVisible();
  });

  test('displays protocols table', async ({ page }) => {
    await waitForTable(page);
    await expect(page.getByRole('table')).toBeVisible();
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
    await expect(
      page.getByRole('cell', { name: 'Test Protocol' }),
    ).toBeVisible();
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
      page.getByRole('cell', { name: /no.*result|no.*found|no.*data/i }),
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
    const headerCheckbox = page
      .getByTestId('data-table')
      .locator('thead')
      .getByRole('checkbox');
    await expect(headerCheckbox).toBeChecked();
  });

  test('visual snapshot', async ({ page, capturePage }) => {
    await waitForTable(page, { minRows: 1 });
    await capturePage('protocols-page');
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
    await captureElement(dialog, 'protocols-delete-confirmation');
  });
});
