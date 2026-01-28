import { type Locator, type Page } from '@playwright/test';

export async function waitForTable(
  page: Page,
  options?: { minRows?: number; timeout?: number },
): Promise<Locator> {
  const table = page.locator('table');
  await table.waitFor({ state: 'visible', timeout: options?.timeout });

  if (options?.minRows) {
    await page
      .locator('tbody tr')
      .nth(options.minRows - 1)
      .waitFor({ state: 'visible', timeout: options?.timeout });
  }

  return table;
}

export async function searchTable(page: Page, text: string): Promise<void> {
  const searchInput = page.getByPlaceholder(/search|filter/i);
  await searchInput.fill(text);
  await page.waitForTimeout(500);
}

export async function clearSearch(page: Page): Promise<void> {
  const searchInput = page.getByPlaceholder(/search|filter/i);
  await searchInput.clear();
  await page.waitForTimeout(500);
}

export async function selectAllRows(page: Page): Promise<void> {
  const headerCheckbox = page.locator('thead').getByRole('checkbox');
  await headerCheckbox.click();
}

function getTableRows(page: Page): Locator {
  return page.locator('tbody tr');
}

export async function getTableRowCount(page: Page): Promise<number> {
  const noResults = page.locator('tbody').getByText('No results.');
  if (await noResults.isVisible().catch(() => false)) {
    return 0;
  }
  return getTableRows(page).count();
}

export async function clickSortColumn(page: Page, name: string): Promise<void> {
  const header = page.locator('thead').getByRole('button', { name });
  await header.click();
}
