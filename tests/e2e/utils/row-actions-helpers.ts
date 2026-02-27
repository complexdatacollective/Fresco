import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { confirmDeletion, getDialog } from './dialog-helpers';

/**
 * Get the first table row.
 */
export function getFirstRow(page: Page): Locator {
  return page.locator('tbody tr').first();
}

/**
 * Get the actions button (usually the last button) in a row.
 */
function getRowActionsButton(row: Locator): Locator {
  return row.getByRole('button').last();
}

/**
 * Open the row actions dropdown menu.
 */
export async function openRowActions(row: Locator): Promise<void> {
  const actionsButton = getRowActionsButton(row);
  await expect(actionsButton).toBeVisible();
  await actionsButton.click();
}

/**
 * Click a menu item in the currently open actions menu.
 */
async function clickMenuItem(
  page: Page,
  itemName: string | RegExp,
): Promise<void> {
  const menuItem = page.getByRole('menuitem', { name: itemName });
  await expect(menuItem).toBeVisible();
  await menuItem.click();
}

/**
 * Delete a single item via its row actions menu.
 * Handles: opening menu → clicking delete → confirming dialog.
 */
export async function deleteSingleItem(
  page: Page,
  row: Locator,
): Promise<void> {
  await openRowActions(row);
  await clickMenuItem(page, /delete/i);
  await confirmDeletion(page);
}

/**
 * Edit an item via its row actions menu.
 * Returns the dialog locator for further interaction.
 */
export async function openEditDialog(
  page: Page,
  row: Locator,
): Promise<Locator> {
  await openRowActions(row);
  await clickMenuItem(page, /edit/i);
  const dialog = getDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

/**
 * Bulk delete selected rows.
 * Assumes rows are already selected.
 */
export async function bulkDeleteSelected(page: Page): Promise<void> {
  const deleteSelectedButton = page.getByRole('button', {
    name: /delete selected|delete \d+/i,
  });
  await expect(deleteSelectedButton).toBeVisible();
  await deleteSelectedButton.click();
  await confirmDeletion(page);
}
