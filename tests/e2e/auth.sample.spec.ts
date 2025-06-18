import { test, expect } from '~/tests/e2e/fixtures';

test.describe('Authentication Tests', () => {
  test('should login and access dashboard with authenticatedPage', async ({ authenticatedPage }) => {
    // Should already be logged in and on dashboard
    await expect(authenticatedPage).toHaveURL(/.*\/dashboard/);
    
    // Should see dashboard content
    await expect(authenticatedPage.locator('h1')).toContainText('Dashboard');
  });

  test('should allow manual login with loginAsUser', async ({ page, loginAsUser, basicData }) => {
    // Manually login using the fixture
    await loginAsUser(basicData.user.username, basicData.user.password);
    
    // Should be on dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should handle logout', async ({ authenticatedPage }) => {
    // Find and click logout button (adjust selector for your app)
    await authenticatedPage.click('[data-testid="logout-button"]');
    
    // Should redirect to signin
    await expect(authenticatedPage).toHaveURL(/.*\/signin/);
  });
});