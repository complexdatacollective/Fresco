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
