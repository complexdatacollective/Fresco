import { test, expect } from '../fixtures/test-fixtures';
import { DashboardPage, LoginPage } from '../helpers/page-objects';

test.describe('Dashboard - Protocol Management', () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page, apiHelper, testUser }) => {
    // Setup test data
    await apiHelper.resetDatabase();
    await apiHelper.createUser();

    // Login
    loginPage = new LoginPage(page);
    await loginPage.login(testUser.username, testUser.password);

    dashboardPage = new DashboardPage(page);
  });

  test('displays uploaded protocols', async ({ page, apiHelper }) => {
    // Create test protocol
    await apiHelper.createProtocol({
      name: 'Test Protocol 1',
      description: 'A test protocol for E2E testing',
    });

    // Navigate to dashboard
    await dashboardPage.navigateToDashboard();

    // Verify protocol is displayed
    await expect(page.locator('text=Test Protocol 1')).toBeVisible();
    await expect(
      page.locator('text=A test protocol for E2E testing'),
    ).toBeVisible();
  });

  test('allows protocol upload', async ({ page }) => {
    await dashboardPage.navigateToDashboard();

    // Click upload button
    await dashboardPage.uploadButton.click();

    // Verify upload dialog appears
    await expect(page.locator('text=Upload Protocol')).toBeVisible();

    // Note: Actual file upload would require a test protocol file
    // This is a placeholder for the upload flow
  });

  test('displays protocol statistics', async ({ page, apiHelper }) => {
    // Create protocol with interviews
    const result = await apiHelper.createProtocol({
      name: 'Protocol with Stats',
    }) as { protocol: { id: string } };

    // Create some interviews
    await apiHelper.createInterview({
      protocolId: result.protocol.id,
      participantId: 'participant-1',
    });
    await apiHelper.createInterview({
      protocolId: result.protocol.id,
      participantId: 'participant-2',
    });

    await dashboardPage.navigateToDashboard();

    // Check for statistics
    await expect(page.locator('text=2 Interviews')).toBeVisible();
  });

  test('visual regression - dashboard', async ({ page, apiHelper }) => {
    // Create some test data
    await apiHelper.createProtocol({ name: 'Visual Test Protocol' });

    await dashboardPage.navigateToDashboard();
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('can delete protocol', async ({ page, apiHelper }) => {
    // Create protocol
    await apiHelper.createProtocol({ name: 'Protocol to Delete' });

    await dashboardPage.navigateToDashboard();

    // Find and click delete button
    const protocolCard = page.locator('text=Protocol to Delete').locator('..');
    await protocolCard.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.locator('button:has-text("Confirm")').click();

    // Verify protocol is removed
    await expect(page.locator('text=Protocol to Delete')).not.toBeVisible();
  });
});
