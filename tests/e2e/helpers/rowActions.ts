import { type Locator, type Page } from '@playwright/test';

export function getFirstRow(page: Page): Locator {
  return page.getByTestId('data-table').locator('tbody tr').first();
}

export async function openRowActions(row: Locator): Promise<void> {
  const actionsButton = row.getByRole('button').last();
  await actionsButton.click();
}
