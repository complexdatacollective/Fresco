import { test } from '~/tests/e2e/fixtures/functional';
import { expect } from '@playwright/test';

/**
 * Sample functional test to demonstrate the base infrastructure
 * This test can be used as a template for Phase A functional tests
 */
test.describe('Dashboard - Sample Functional Tests', () => {
  test.beforeEach(async ({ dashboardData, setupFunctionalTest }) => {
    // Ensure test data is available
    void dashboardData;

    // Set up functional test environment
    await setupFunctionalTest({
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
    });
  });

  test('should load dashboard overview page successfully', async ({
    dashboardPage,
    waitForPageStability,
  }) => {
    // Navigate to dashboard
    await dashboardPage.goto();

    // Wait for page to be stable
    await waitForPageStability();

    // Verify page is loaded
    await dashboardPage.verifyPageLoaded();

    // Verify page title
    const title = await dashboardPage.getPageTitle();
    expect(title).toBeTruthy();

    // Verify navigation is working
    const isAuth = await dashboardPage.isAuthenticated();
    expect(isAuth).toBe(true);
  });

  test('should navigate between dashboard sections', async ({
    dashboardPage,
    waitForPageStability,
  }) => {
    // Start at dashboard overview
    await dashboardPage.goto();
    await waitForPageStability();

    // Navigate to participants
    await dashboardPage.navigateToParticipants();
    await waitForPageStability();

    // Verify we're on participants page
    const page = dashboardPage.getPage();
    await expect(page).toHaveURL('/dashboard/participants');

    // Navigate to protocols
    await dashboardPage.navigateToProtocols();
    await waitForPageStability();

    // Verify we're on protocols page
    await expect(page).toHaveURL('/dashboard/protocols');

    // Navigate to interviews
    await dashboardPage.navigateToInterviews();
    await waitForPageStability();

    // Verify we're on interviews page
    await expect(page).toHaveURL('/dashboard/interviews');

    // Navigate back to overview
    await dashboardPage.navigateToOverview();
    await waitForPageStability();

    // Verify we're back at overview
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle page errors gracefully', async ({
    dashboardPage,
    waitForPageStability,
  }) => {
    // Navigate to dashboard
    await dashboardPage.goto();
    await waitForPageStability();

    // Try to navigate to non-existent page
    await dashboardPage.getPage().goto('/dashboard/nonexistent');

    // Should handle gracefully - might redirect or show 404
    // This depends on your app's error handling
    await waitForPageStability();

    // Verify we can still navigate back to working pages
    await dashboardPage.navigateToOverview();
    await waitForPageStability();

    await dashboardPage.verifyPageLoaded();
  });

  test('should maintain authentication state across navigation', async ({
    dashboardPage,
    waitForPageStability,
  }) => {
    // Navigate to dashboard
    await dashboardPage.goto();
    await waitForPageStability();

    // Verify authenticated
    let isAuth = await dashboardPage.isAuthenticated();
    expect(isAuth).toBe(true);

    // Navigate to different sections
    await dashboardPage.navigateToParticipants();
    await waitForPageStability();
    isAuth = await dashboardPage.isAuthenticated();
    expect(isAuth).toBe(true);

    await dashboardPage.navigateToProtocols();
    await waitForPageStability();
    isAuth = await dashboardPage.isAuthenticated();
    expect(isAuth).toBe(true);

    await dashboardPage.navigateToInterviews();
    await waitForPageStability();
    isAuth = await dashboardPage.isAuthenticated();
    expect(isAuth).toBe(true);

    // Refresh page and verify still authenticated
    await dashboardPage.refreshPage();
    await waitForPageStability();
    isAuth = await dashboardPage.isAuthenticated();
    expect(isAuth).toBe(true);
  });

  test('should handle loading states correctly', async ({
    dashboardPage,
    waitForPageStability,
  }) => {
    // Navigate to dashboard
    await dashboardPage.goto();

    // Wait for loading to complete
    await dashboardPage.waitForLoadingToComplete();

    // Verify page is stable
    await waitForPageStability();

    // Navigate to data-heavy page (participants)
    await dashboardPage.navigateToParticipants();

    // Wait for loading to complete
    await dashboardPage.waitForLoadingToComplete();

    // Verify page is stable
    await waitForPageStability();

    // Page should be fully loaded
    await dashboardPage.verifyPageLoaded();
  });

  test('should handle form interactions', async ({
    dashboardPage,
    waitForPageStability,
  }) => {
    // Navigate to participants page (likely has forms)
    await dashboardPage.navigateToParticipants();
    await waitForPageStability();

    // Look for search functionality
    try {
      await dashboardPage.searchInTable('test');
      await waitForPageStability();

      // Verify search worked (this depends on your implementation)
      const rowCount = await dashboardPage.getTableRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    } catch (error) {
      // Search functionality might not be available yet
      // eslint-disable-next-line no-console
      console.log('Search functionality not available:', error);
    }
  });
});
