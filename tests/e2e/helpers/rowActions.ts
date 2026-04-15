import { type Locator, type Page } from '@playwright/test';

export function getFirstRow(page: Page): Locator {
  return page.getByTestId('data-table').locator('tbody tr').first();
}

export async function openRowActions(row: Locator): Promise<void> {
  const actionsButton = row.getByRole('button', { name: /open menu/i });
  await actionsButton.waitFor({ state: 'visible' });
  // Keyboard activation is more reliable than click() on WebKit for
  // Base UI dropdown triggers — pointer events can race with layout
  // animations in data-table rows.
  await actionsButton.focus();
  await actionsButton.press('Enter');
}
