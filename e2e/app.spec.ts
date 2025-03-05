
import { expect, test } from '@playwright/test';


// app should be setup before this is run

test('should sign in', async ({ page }) => {

  await page.goto("/");  // base url is set in playwright.config.ts
  await expect(page).toHaveURL(/\/signin/);

  // sign in using credentials
  await page.fill('input[name="username"]', 'test-user', { timeout: 5000 });
  await page.fill('input[name="password"]', 'TestUser1!', { timeout: 5000 });
  await page.click('button[type="submit"]', { timeout: 10000 });

  await expect(page).toHaveURL(/\/dashboard/);
});