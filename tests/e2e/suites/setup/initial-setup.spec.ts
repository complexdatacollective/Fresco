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

      // Step 1: Create admin account
      await page.getByRole('textbox', { name: 'Username' }).fill('testadmin');
      await page.getByRole('textbox', { name: 'Password' }).fill('TestAdmin123!');
      await page.getByRole('textbox', { name: 'Confirm password' }).fill('TestAdmin123!');
      
      // Wait for button to be enabled and submit
      await page.waitForSelector('button:has-text("Create account"):not([disabled])');
      await page.getByRole('button', { name: 'Create account' }).click();

      // Step 2: UploadThing configuration
      await expect(page).toHaveURL(/step=2/);
      await page.getByRole('textbox', { name: /UPLOADTHING_TOKEN/i }).fill('sk_test_dummy_token_for_testing');
      await page.getByRole('button', { name: /save.*continue/i }).click();

      // Step 3: Upload Protocol (optional)
      await expect(page).toHaveURL(/step=3/);
      await expect(page.getByRole('heading', { name: 'Import Protocols' })).toBeVisible();
      // Skip protocol upload - just continue
      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 4: Configure Participation
      await expect(page).toHaveURL(/step=4/);
      await expect(page.getByRole('heading', { name: 'Configure Participation', level: 2 })).toBeVisible();
      
      // Optionally configure some settings (Anonymous Recruitment, etc.)
      // For now, just continue with defaults
      await page.getByRole('button', { name: 'Continue' }).click();

      // Step 5: Documentation (final step)
      await expect(page).toHaveURL(/step=5/);
      await expect(page.getByRole('heading', { name: 'Documentation', level: 2 })).toBeVisible();
      
      // Complete onboarding
      await page.getByRole('button', { name: 'Go to the dashboard!' }).click();

      // Should now be on the dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
      
      // Verify we can see the main navigation (use nav element to be specific)
      await expect(page.locator('nav').getByRole('link', { name: 'Protocols' })).toBeVisible();
      await expect(page.locator('nav').getByRole('link', { name: 'Participants' })).toBeVisible();
      await expect(page.locator('nav').getByRole('link', { name: 'Interviews' })).toBeVisible();
    });
  });
});
