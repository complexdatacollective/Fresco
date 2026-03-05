import { type Locator, type Page } from '@playwright/test';

function getDialog(page: Page): Locator {
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

export async function confirmDeletion(page: Page): Promise<void> {
  const dialog = getDialog(page);
  const confirmButton = dialog.getByRole('button', {
    name: /delete|confirm|remove/i,
  });
  await confirmButton.click();
  await dialog.waitFor({ state: 'hidden' });
}
