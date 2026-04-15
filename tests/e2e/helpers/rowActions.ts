import { type Locator, type Page } from '@playwright/test';

export function getFirstRow(page: Page): Locator {
  return page.getByTestId('data-table').locator('tbody tr').first();
}

export async function openRowActions(row: Locator): Promise<void> {
  const actionsButton = row.getByRole('button').last();
  // force: true bypasses Playwright's actionability stability check,
  // which intermittently fails on webkit for Button components even
  // with animations disabled.
  await actionsButton.click({ force: true });
}
