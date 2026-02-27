import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { confirmDeletion, getDialog } from './dialog-helpers';
import { waitForSearchDebounce } from './table-helpers';

const DEFAULT_MENU_TIMEOUT = 5000;

/**
 * Get a table row by its text content.
 */
function getRowByContent(page: Page, content: string | RegExp): Locator {
  return page.locator('tbody tr').filter({ hasText: content });
}

/**
 * Get a table row by index (0-based).
 */
export function getRowByIndex(page: Page, index: number): Locator {
  return page.locator('tbody tr').nth(index);
}

/**
 * Get the first table row.
 */
export function getFirstRow(page: Page): Locator {
  return page.locator('tbody tr').first();
}

/**
 * Get the actions button (usually the last button) in a row.
 */
export function getRowActionsButton(row: Locator): Locator {
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
 * Open the row actions menu and get the menu locator.
 */
export async function openRowActionsMenu(
  page: Page,
  row: Locator,
): Promise<Locator> {
  await openRowActions(row);
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible({ timeout: DEFAULT_MENU_TIMEOUT });
  return menu;
}

/**
 * Click a menu item in the currently open actions menu.
 */
export async function clickMenuItem(
  page: Page,
  itemName: string | RegExp,
): Promise<void> {
  const menuItem = page.getByRole('menuitem', { name: itemName });
  await expect(menuItem).toBeVisible();
  await menuItem.click();
}

/**
 * Close the currently open actions menu.
 */
export async function closeActionsMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
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

/**
 * Select specific rows by their content, then delete them.
 */
export async function selectAndDeleteRows(
  page: Page,
  rowContents: (string | RegExp)[],
): Promise<void> {
  for (const content of rowContents) {
    const row = getRowByContent(page, content);
    const checkbox = row.locator('[role="checkbox"]');
    await checkbox.click();
  }
  await page.waitForTimeout(300);
  await bulkDeleteSelected(page);
}

/**
 * Delete all items by selecting all and bulk deleting.
 */
export async function deleteAllItems(page: Page): Promise<void> {
  const selectAllCheckbox = page.locator('thead [role="checkbox"]').first();
  await selectAllCheckbox.click();
  await page.waitForTimeout(300);
  await bulkDeleteSelected(page);
}

/**
 * Verify a row with specific content exists.
 */
export async function expectRowToExist(
  page: Page,
  content: string | RegExp,
): Promise<void> {
  const row = getRowByContent(page, content);
  await expect(row).toBeVisible({ timeout: 10000 });
}

/**
 * Verify a row with specific content does not exist.
 */
export async function expectRowNotToExist(
  page: Page,
  content: string | RegExp,
): Promise<void> {
  const row = getRowByContent(page, content);
  await expect(row).not.toBeVisible({ timeout: 10000 });
}

/**
 * Find a row by content, then filter the table to ensure only that row shows.
 * Useful when the row might be on a different page.
 */
export async function filterToRow(
  page: Page,
  searchText: string,
): Promise<Locator> {
  const searchInput = page.getByPlaceholder(/filter|search|identifier|name/i);
  await searchInput.fill(searchText);
  await waitForSearchDebounce(page);
  return getFirstRow(page);
}
