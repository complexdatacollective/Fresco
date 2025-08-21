import { test, expect } from '../fixtures/test-fixtures';
import { LoginPage } from '../helpers/page-objects';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page, apiHelper }) => {
    // Reset database and create test user
    await apiHelper.resetDatabase();
    await apiHelper.createUser({
      username: 'testuser@example.com'
    });

    loginPage = new LoginPage(page);
  });

  test('successful login redirects to dashboard', async ({
    page,
    testUser,
  }) => {
    await loginPage.login(testUser.username, testUser.password);

    // Verify redirect to dashboard with longer timeout
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Verify dashboard content is loaded
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
  });

  test('invalid credentials show error message', async ({ page }) => {
    await loginPage.login('invalid@example.com', 'wrong-password');

    // Verify error message
    const hasError = await loginPage.expectError('Incorrect username or password');
    expect(hasError).toBeTruthy();

    // Should remain on signin page
    await expect(page).toHaveURL('/signin');
  });

  test('empty fields show validation errors', async ({ page }) => {
    await loginPage.navigate('/signin');
    await loginPage.submitButton.click();

    // Check for validation messages
    await expect(page.locator('text=Username cannot be empty')).toBeVisible();
    await expect(page.locator('text=Password cannot be empty')).toBeVisible();
  });

  test('visual regression - login page', async ({ page }) => {
    await loginPage.navigate('/signin');

    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test.skip('logout redirects to login page', async ({ page, testUser }) => {
    // Login first
    await loginPage.login(testUser.username, testUser.password);
    await expect(page).toHaveURL('/dashboard');

    // TODO: Find the actual logout mechanism in the app
    // The app might not have a visible logout button
    // This test is skipped until we identify the logout flow
    
    // Should redirect to signin
    // await expect(page).toHaveURL('/signin');
  });
});
