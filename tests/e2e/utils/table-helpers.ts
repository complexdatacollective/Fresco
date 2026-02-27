import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

const DEFAULT_SEARCH_DEBOUNCE_MS = 500;
const DEFAULT_TABLE_TIMEOUT = 10000;

/**
 * Wait for a table to be visible and optionally have a minimum number of rows.
 */
export async function waitForTable(
  page: Page,
  options?: { minRows?: number; timeout?: number },
): Promise<Locator> {
  const timeout = options?.timeout ?? DEFAULT_TABLE_TIMEOUT;
  const table = page.locator('table').first();
  await expect(table).toBeVisible({ timeout });

  if (options?.minRows && options.minRows > 0) {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(options.minRows);
  }

  return table;
}

/**
 * Wait for the search debounce to complete.
 * Use this after filling a search/filter input.
 */
export async function waitForSearchDebounce(
  page: Page,
  ms = DEFAULT_SEARCH_DEBOUNCE_MS,
): Promise<void> {
  await page.waitForTimeout(ms);
}

/**
 * Get the search/filter input for a data table.
 * Scoped to inputs with type="search" to avoid matching dialog inputs.
 */
export async function getSearchInput(page: Page): Promise<Locator> {
  const searchInput = page.locator('input[type="search"]').first();
  await expect(searchInput).toBeVisible({ timeout: DEFAULT_TABLE_TIMEOUT });
  return searchInput;
}

/**
 * Search/filter the table and wait for results.
 */
export async function searchTable(
  page: Page,
  searchText: string,
): Promise<void> {
  const searchInput = await getSearchInput(page);
  await searchInput.fill(searchText);
  await waitForSearchDebounce(page);
}

/**
 * Clear the search/filter input and wait for full results.
 */
export async function clearSearch(page: Page): Promise<void> {
  const searchInput = await getSearchInput(page);
  await searchInput.clear();
  await waitForSearchDebounce(page);
}

/**
 * Select all rows using the header checkbox.
 */
export async function selectAllRows(page: Page): Promise<void> {
  const selectAllCheckbox = page.locator('thead [role="checkbox"]').first();
  await expect(selectAllCheckbox).toBeVisible();
  await selectAllCheckbox.click();
  // Wait for selection to propagate
  await page.waitForTimeout(300);
}

/**
 * Deselect all rows using the header checkbox.
 */
export async function deselectAllRows(page: Page): Promise<void> {
  await selectAllRows(page);
}

/**
 * Get all row checkboxes in the table body.
 */
export function getRowCheckboxes(page: Page): Locator {
  return page.locator('tbody [role="checkbox"]');
}

/**
 * Verify all rows are selected (checkboxes checked).
 */
export async function expectAllRowsSelected(page: Page): Promise<void> {
  const rowCheckboxes = getRowCheckboxes(page);
  const count = await rowCheckboxes.count();

  for (let i = 0; i < count; i++) {
    await expect(rowCheckboxes.nth(i)).toHaveAttribute('aria-checked', 'true');
  }
}

/**
 * Get table rows from the tbody.
 */
export function getTableRows(page: Page): Locator {
  return page.locator('tbody tr');
}

/**
 * Get the count of visible table rows.
 */
export async function getTableRowCount(page: Page): Promise<number> {
  return await getTableRows(page).count();
}

/**
 * Click a sortable column header to toggle sort.
 */
export async function clickSortColumn(
  page: Page,
  columnName: string | RegExp,
): Promise<void> {
  const sortButton = page.getByRole('button', { name: columnName }).first();
  await expect(sortButton).toBeVisible();
  await sortButton.click();
  await page.waitForTimeout(300);
}
