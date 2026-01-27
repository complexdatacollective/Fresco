import { test, expect } from '@playwright/test';
import { fillField } from '../../helpers/form.js';

test('authenticate as admin and save state', async ({ page }) => {
  await page.goto('/signin');

  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

  await fillField(page, 'username', 'testadmin');
  await fillField(page, 'password', 'TestAdmin123!');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  // Save authentication state for use by dashboard tests
  await page.context().storageState({ path: './tests/e2e/.auth/admin.json' });
});
