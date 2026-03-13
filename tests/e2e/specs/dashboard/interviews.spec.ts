import { expect, test } from '../../fixtures/test.js';
import { waitForDialog } from '../../helpers/dialog.js';
import { getFirstRow, openRowActions } from '../../helpers/row-actions.js';
import {
  clickSortColumn,
  getTableRowCount,
  searchTable,
  selectAllRows,
  waitForTable,
} from '../../helpers/table.js';

test.describe('Interviews Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/interviews');
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

  test('export incomplete urls popover opens', async ({ page }) => {
    await waitForTable(page, { minRows: 1 });
    const trigger = page.getByTestId('export-incomplete-urls-button');
    await expect(trigger).toBeVisible();
    await trigger.click();

    const popover = page.getByRole('dialog');
    await expect(popover).toBeVisible();
    await expect(
      popover.getByRole('button', { name: /export incomplete/i }),
    ).toBeVisible();
  });

  test('visual snapshot', async ({ page, capturePage }) => {
    await waitForTable(page, { minRows: 5 });
    await capturePage('interviews-page');
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
