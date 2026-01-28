import { test, expect } from '@playwright/test';
import { fillField } from '../../helpers/form.js';

test.describe('Setup Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test('redirects to setup page on first visit', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/setup/);
  });

  test('completes the onboarding wizard', async ({ page }) => {
    await page.goto('/setup');

    // Step 1: Create Account
    await expect(
      page.getByRole('heading', { name: 'Create an Admin Account', level: 2 }),
    ).toBeVisible();
    await fillField(page, 'username', 'testadmin');
    await fillField(page, 'password', 'TestAdmin123!');
    await fillField(page, 'confirmPassword', 'TestAdmin123!');
    await page.getByRole('button', { name: 'Create account' }).click();

    // Step 2: Connect UploadThing
    await expect(
      page.getByRole('heading', { name: 'Connect UploadThing', level: 2 }),
    ).toBeVisible();
    await fillField(
      page,
      'uploadThingToken',
      'UPLOADTHING_TOKEN=test_token_value_here_12345',
    );
    await page.getByRole('button', { name: 'Save and continue' }).click();

    // Step 3: Upload Protocol - skip
    await expect(
      page.getByRole('heading', { name: 'Import Protocols', level: 2 }),
    ).toBeVisible();
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 4: Configure Participation - skip
    await expect(
      page.getByRole('heading', {
        name: 'Configure Participation',
        level: 2,
      }),
    ).toBeVisible();
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 5: Documentation - complete
    await expect(
      page.getByRole('heading', { name: 'Documentation', level: 2 }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Go to the dashboard!' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    // Verify dashboard heading is visible
    await expect(
      page.getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
  });
});
