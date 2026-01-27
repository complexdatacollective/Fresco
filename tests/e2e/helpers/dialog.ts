import { type Locator, type Page } from '@playwright/test';

export function getDialog(page: Page): Locator {
  return page.getByRole('dialog');
}

export async function waitForDialog(
  page: Page,
  options?: { timeout?: number },
): Promise<Locator> {
  const dialog = getDialog(page);
  await dialog.waitFor({ state: 'visible', timeout: options?.timeout });
  return dialog;
}

export async function openDialog(
  page: Page,
  buttonName: string,
): Promise<Locator> {
  await page.getByRole('button', { name: buttonName }).click();
  return waitForDialog(page);
}

export async function closeDialog(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await getDialog(page).waitFor({ state: 'hidden' });
}

export async function confirmDeletion(page: Page): Promise<void> {
  const dialog = getDialog(page);
  const confirmButton = dialog.getByRole('button', {
    name: /delete|confirm|remove/i,
  });
  await confirmButton.click();
  await dialog.waitFor({ state: 'hidden' });
}

export async function cancelDialog(page: Page): Promise<void> {
  const dialog = getDialog(page);
  const cancelButton = dialog.getByRole('button', { name: /cancel/i });
  await cancelButton.click();
  await dialog.waitFor({ state: 'hidden' });
}

export async function submitDialog(
  page: Page,
  buttonName?: string,
): Promise<void> {
  const dialog = getDialog(page);
  const submitButton = buttonName
    ? dialog.getByRole('button', { name: buttonName })
    : dialog.getByRole('button', { name: /submit|save|create|add|confirm/i });
  await submitButton.click();
}
