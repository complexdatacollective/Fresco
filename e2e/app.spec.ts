
import { expect, test } from '@playwright/test';


// app should be setup before this is run

test('should sign in', async ({ page }) => {

  await page.goto("/");  // base url is set in playwright.config.ts
  await expect(page).toHaveURL(/\/signin/);

  // sign in using credentials
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'Administrator1!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  // eslint-disable-next-line no-console
  console.log('✅ Signed in successfully after setup');

});