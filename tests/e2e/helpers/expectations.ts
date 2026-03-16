import { expect, type Page } from '@playwright/test';

const URL_ASSERTION_TIMEOUT = 15_000;

export async function expectURL(
  page: Page,
  urlOrRegex: string | RegExp,
  options?: { timeout?: number },
) {
  await expect(page).toHaveURL(urlOrRegex, {
    timeout: options?.timeout ?? URL_ASSERTION_TIMEOUT,
  });
}
