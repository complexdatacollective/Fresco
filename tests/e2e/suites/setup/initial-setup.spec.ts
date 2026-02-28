import { expect, test } from '@playwright/test';

test.describe('Initial App Setup', () => {
  test.describe.serial('First-time setup flow', () => {
    test('should redirect to setup page when not configured', async ({
      page,
    }) => {
      await page.goto('/');

      // Should redirect to setup
      await expect(page).toHaveURL(/\/setup/);
      await expect(page.locator('h1, h2, h3')).toContainText(
        /Welcome|Setup|Configure|Create.*Account/i,
      );
    });

    test('should complete initial configuration', async ({ page }) => {
      await page.goto('/setup');

      // Step 1: Create admin account with standardized credentials
      await page.getByRole('textbox', { name: 'Username' }).fill('admin');
      await page
        .getByRole('textbox', { name: 'Password' })
        .fill('Administrator1!');
      await page
        .getByRole('textbox', { name: 'Confirm password' })
        .fill('Administrator1!');

      // Wait for button to be enabled and submit
      const createButton = page.getByRole('button', { name: 'Create account' });
      await expect(createButton).toBeEnabled({ timeout: 5000 });
      await createButton.click();

      // Step 2: UploadThing configuration - wait for heading to appear (more reliable than URL)
      await expect(
        page.getByRole('heading', { name: 'Connect UploadThing', level: 2 }),
      ).toBeVisible({ timeout: 15000 });
      await page
        .getByRole('textbox', { name: /UPLOADTHING_TOKEN/i })
        .fill('sk_test_dummy_token_for_testing');
      await page.getByRole('button', { name: /save.*continue/i }).click();

      // Step 3: Upload Protocol (optional) - wait for heading
      await expect(
        page.getByRole('heading', { name: 'Import Protocols', level: 2 }),
      ).toBeVisible({ timeout: 15000 });
      // Skip protocol upload - just continue
      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 4: Configure Participation - wait for heading
      await expect(
        page.getByRole('heading', {
          name: 'Configure Participation',
          level: 2,
        }),
      ).toBeVisible({ timeout: 15000 });

      // Optionally configure some settings (Anonymous Recruitment, etc.)
      // For now, just continue with defaults
      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 5: Documentation (final step) - wait for heading
      await expect(
        page.getByRole('heading', { name: 'Documentation', level: 2 }),
      ).toBeVisible({ timeout: 15000 });

      // Complete onboarding
      await page.getByRole('button', { name: 'Go to the dashboard!' }).click();

      // Should now be on the dashboard - wait for navigation and content
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
      await expect(
        page.getByRole('heading', { name: 'Dashboard' }),
      ).toBeVisible({ timeout: 10000 });

      // Verify we can see the main navigation (use nav element to be specific)
      await expect(
        page.locator('nav').getByRole('link', { name: 'Protocols' }),
      ).toBeVisible();
      await expect(
        page.locator('nav').getByRole('link', { name: 'Participants' }),
      ).toBeVisible();
      await expect(
        page.locator('nav').getByRole('link', { name: 'Interviews' }),
      ).toBeVisible();
    });
  });
});
