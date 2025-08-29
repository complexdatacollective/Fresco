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

      // Fill in configuration form
      await page.fill('[name="adminUsername"]', 'testadmin');
      await page.fill('[name="adminPassword"]', 'TestAdmin123!');
      await page.fill('[name="confirmPassword"]', 'TestAdmin123!');

      // Configure app settings
      const anonymousToggle = page.locator(
        '[name="allowAnonymousRecruitment"]',
      );
      if (await anonymousToggle.isVisible()) {
        await anonymousToggle.check();
      }

      // Submit configuration
      await page.click(
        '[type="submit"], button:has-text("Configure"), button:has-text("Setup")',
      );

      // Wait for success indication
      await expect(page).toHaveURL(/\/(dashboard|protocols|home)/);

      // Verify we can access the app
      await expect(page.locator('body')).not.toContainText(/error/i);
    });

    test('should be able to login with created admin account', async ({
      page,
    }) => {
      // Try to logout first if already logged in
      const userMenu = page.locator(
        '[data-testid="user-menu"], [aria-label="User menu"]',
      );
      if (await userMenu.isVisible()) {
        await userMenu.click();
        const logoutButton = page.locator(
          'button:has-text("Logout"), a:has-text("Logout")',
        );
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
        }
      }

      // Navigate to login
      await page.goto('/signin');

      // Login with admin credentials
      await page.fill('[name="username"], [type="text"]', 'testadmin');
      await page.fill('[name="password"], [type="password"]', 'TestAdmin123!');
      await page.click('[type="submit"], button:has-text("Login")');

      // Should be logged in
      await expect(page).toHaveURL(/\/(dashboard|protocols|home)/);
    });
  });
});
