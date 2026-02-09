import { expect, test } from '@playwright/test';

const ADMIN_CREDENTIALS = {
  username: 'testadmin',
  password: 'TestAdmin123!',
};

// Longer timeout for heading assertions since step transitions may trigger
// server component re-renders via nuqs URL state changes
const STEP_TIMEOUT = 15_000;

test.describe('Initial App Setup', () => {
  test.describe.configure({ mode: 'serial' });

  test('should redirect to setup page when not configured', async ({
    page,
  }) => {
    await page.goto('/');

    // Should redirect to setup
    await expect(page).toHaveURL(/\/setup/, { timeout: STEP_TIMEOUT });
    await expect(page.locator('h1, h2, h3')).toContainText(
      /Welcome|Setup|Configure|Create.*Account/i,
    );
  });

  test('should complete initial configuration', async ({ page }) => {
    await page.goto('/setup');

    // Step 1: Create admin account
    await expect(
      page.getByRole('heading', { name: /Create.*Account/i, level: 2 }),
    ).toBeVisible({ timeout: STEP_TIMEOUT });

    await page
      .getByRole('textbox', { name: 'Username' })
      .fill(ADMIN_CREDENTIALS.username);
    await page
      .getByRole('textbox', { name: 'Password' })
      .fill(ADMIN_CREDENTIALS.password);
    await page
      .getByRole('textbox', { name: 'Confirm password' })
      .fill(ADMIN_CREDENTIALS.password);

    await page.getByRole('button', { name: 'Create account' }).click();

    // Step 2: UploadThing configuration
    await expect(
      page.getByRole('heading', { name: /Connect UploadThing/i, level: 2 }),
    ).toBeVisible({ timeout: STEP_TIMEOUT });

    await page
      .getByRole('textbox', { name: /UPLOADTHING_TOKEN/i })
      .fill('UPLOADTHING_TOKEN=test_token_value_here_12345');
    await page.getByRole('button', { name: /save.*continue/i }).click();

    // Step 3: Upload Protocol (optional) - skip
    await expect(
      page.getByRole('heading', { name: 'Import Protocols', level: 2 }),
    ).toBeVisible({ timeout: STEP_TIMEOUT });

    // Wait for the step to fully render before clicking Continue
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /^continue$/i }).click();

    // Step 4: Configure Participation - skip
    await expect(
      page.getByRole('heading', {
        name: 'Configure Participation',
        level: 2,
      }),
    ).toBeVisible({ timeout: STEP_TIMEOUT });
    await page.getByRole('button', { name: /^continue$/i }).click();

    // Step 5: Documentation (final step)
    await expect(
      page.getByRole('heading', { name: 'Documentation', level: 2 }),
    ).toBeVisible({ timeout: STEP_TIMEOUT });

    // Complete onboarding
    await page.getByRole('button', { name: 'Go to the dashboard!' }).click();

    // Should now be on the dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: STEP_TIMEOUT });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
      timeout: STEP_TIMEOUT,
    });
  });
});
