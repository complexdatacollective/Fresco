import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

const DEFAULT_DIALOG_TIMEOUT = 5000;

/**
 * Get the currently visible dialog/modal.
 */
export function getDialog(page: Page): Locator {
  return page.getByRole('dialog');
}

/**
 * Wait for a dialog to appear.
 */
export async function waitForDialog(
  page: Page,
  options?: { timeout?: number },
): Promise<Locator> {
  const dialog = getDialog(page);
  await expect(dialog).toBeVisible({
    timeout: options?.timeout ?? DEFAULT_DIALOG_TIMEOUT,
  });
  return dialog;
}

/**
 * Wait for a dialog to close.
 */
export async function waitForDialogToClose(
  page: Page,
  options?: { timeout?: number },
): Promise<void> {
  const dialog = getDialog(page);
  await expect(dialog).not.toBeVisible({
    timeout: options?.timeout ?? 10000,
  });
}

/**
 * Open a dialog by clicking a trigger button.
 */
export async function openDialog(
  page: Page,
  triggerButtonName: string | RegExp,
): Promise<Locator> {
  const triggerButton = page.getByRole('button', { name: triggerButtonName });
  await expect(triggerButton).toBeVisible();
  await triggerButton.click();
  return await waitForDialog(page);
}

/**
 * Close a dialog by pressing Escape.
 */
export async function closeDialog(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await waitForDialogToClose(page);
}

/**
 * Click the confirmation button in a delete/confirm dialog.
 * Looks for buttons matching common confirmation patterns.
 */
export async function confirmDeletion(page: Page): Promise<void> {
  const dialog = getDialog(page);
  const confirmButton = dialog.getByRole('button', {
    name: /delete|confirm|yes/i,
  });
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();
  await waitForDialogToClose(page);
}

/**
 * Click the cancel button in a dialog.
 */
export async function cancelDialog(page: Page): Promise<void> {
  const dialog = getDialog(page);
  const cancelButton = dialog.getByRole('button', {
    name: /cancel|no|close/i,
  });
  await expect(cancelButton).toBeVisible();
  await cancelButton.click();
  await waitForDialogToClose(page);
}

/**
 * Fill a form field in a dialog by label text.
 */
export async function fillDialogField(
  page: Page,
  labelText: string | RegExp,
  value: string,
): Promise<void> {
  const dialog = getDialog(page);
  // Try by label first, then by placeholder
  let input = dialog.getByLabel(labelText);
  if (!(await input.isVisible())) {
    input = dialog.getByPlaceholder(labelText);
  }
  await expect(input).toBeVisible();
  await input.fill(value);
}

/**
 * Fill a form field in a dialog by placeholder text.
 */
export async function fillDialogFieldByPlaceholder(
  page: Page,
  placeholderText: string | RegExp,
  value: string,
): Promise<void> {
  const dialog = getDialog(page);
  const input = dialog.getByPlaceholder(placeholderText);
  await expect(input).toBeVisible();
  await input.fill(value);
}

/**
 * Fill a form field in a dialog by index (0-based).
 */
export async function fillDialogFieldByIndex(
  page: Page,
  index: number,
  value: string,
): Promise<void> {
  const dialog = getDialog(page);
  const input = dialog.locator('input').nth(index);
  await expect(input).toBeVisible();
  await input.clear();
  await input.fill(value);
}

/**
 * Submit a dialog form using the submit/save button.
 */
export async function submitDialog(
  page: Page,
  submitButtonName?: string | RegExp,
): Promise<void> {
  const dialog = getDialog(page);
  const buttonName = submitButtonName ?? /submit|save|update|create|add/i;
  const submitButton = dialog.getByRole('button', { name: buttonName });
  await expect(submitButton).toBeVisible();
  await submitButton.click();
  await waitForDialogToClose(page);
}

/**
 * Select an option in a native select dropdown within a dialog.
 */
export async function selectDialogOption(
  page: Page,
  optionValue: string | { index: number },
): Promise<void> {
  const dialog = getDialog(page);
  const select = dialog.locator('select').first();
  await expect(select).toBeVisible();

  if (typeof optionValue === 'string') {
    await select.selectOption(optionValue);
  } else {
    await select.selectOption(optionValue);
  }
}

/**
 * Expect a dialog to contain specific text (useful for warnings).
 */
export async function expectDialogToContain(
  page: Page,
  text: string | RegExp,
): Promise<void> {
  const dialog = getDialog(page);
  await expect(dialog).toContainText(text);
}
