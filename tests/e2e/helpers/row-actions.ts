import { type Locator, type Page } from '@playwright/test';
import { confirmDeletion } from './dialog.js';

export function getFirstRow(page: Page): Locator {
  return page.locator('tbody tr').first();
}

export async function openRowActions(row: Locator): Promise<void> {
  const actionsButton = row.getByRole('button').last();
  await actionsButton.click();
}

export async function deleteSingleItem(
  page: Page,
  row: Locator,
): Promise<void> {
  await openRowActions(row);
  await page.getByRole('menuitem', { name: /delete/i }).click();
  await confirmDeletion(page);
}

export async function openEditDialog(
  page: Page,
  row: Locator,
): Promise<Locator> {
  await openRowActions(row);
  await page.getByRole('menuitem', { name: /edit/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  return dialog;
}

export async function bulkDeleteSelected(page: Page): Promise<void> {
  const deleteButton = page.getByRole('button', { name: /delete/i });
  await deleteButton.click();
  await confirmDeletion(page);
}
