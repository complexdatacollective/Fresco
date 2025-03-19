import { expect, test } from '@playwright/test';

// Reset storage state for this file to avoid being authenticated
// allows us to test the sign in page
test.use({ storageState: { cookies: [], origins: [] } });
test('should navigate to signin page ', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/signin/, { timeout: 10000 });
});

test('should sign in and navigate to dashboard ', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/signin/, { timeout: 10000 });

  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'Administrator1!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
});
