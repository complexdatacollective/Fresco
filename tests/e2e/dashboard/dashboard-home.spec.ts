import { test, expect } from '@playwright/test';
import { DashboardHelpers } from '../utils/dashboard-helpers';
import { AuthHelper } from '../utils/auth-helper';
import { selectors } from '../utils/selectors';

test.describe('Dashboard Home Page', () => {
  let dashboardHelpers: DashboardHelpers;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    dashboardHelpers = new DashboardHelpers(page);
    authHelper = new AuthHelper(page);
    
    await dashboardHelpers.navigateToDashboard();
  });

  test('should display main dashboard elements', async ({ page }) => {
    // Check that main dashboard components are visible
    await expect(page.locator(selectors.dashboard.pageTitle)).toContainText(/dashboard|overview/i);
    
    // Wait for summary statistics to load
    await dashboardHelpers.waitForSummaryStats();
    await expect(page.locator(selectors.dashboard.summaryStats)).toBeVisible();
    
    // Check for activity feed
    await dashboardHelpers.waitForActivityFeed();
    await expect(page.locator(selectors.dashboard.activityFeed)).toBeVisible();
    
    // Check navigation is present
    await expect(page.locator(selectors.navigation.navbar)).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Test navigation to different sections using semantic selectors
    const navigationTests = [
      { selector: selectors.navigation.protocolsLink, url: '/dashboard/protocols' },
      { selector: selectors.navigation.participantsLink, url: '/dashboard/participants' },
      { selector: selectors.navigation.interviewsLink, url: '/dashboard/interviews' },
      { selector: selectors.navigation.settingsLink, url: '/dashboard/settings' },
    ];

    for (const navTest of navigationTests) {
      const linkExists = await page.locator(navTest.selector).count() > 0;
      
      if (linkExists) {
        await page.locator(navTest.selector).first().click();
        await expect(page).toHaveURL(new RegExp(navTest.url));
        
        // Go back to dashboard home for next iteration
        await dashboardHelpers.navigateToDashboard();
      } else {
        console.warn(`Navigation link not found: ${navTest.selector}`);
      }
    }
  });

  test('visual regression: dashboard home page', async ({ page }) => {
    // Prepare page for consistent visual testing
    await dashboardHelpers.prepareForVisualTesting();
    
    // Take full page screenshot for visual regression
    await dashboardHelpers.expectVisualRegression('dashboard-home-full-page');
  });

  test('visual regression: summary statistics', async ({ page }) => {
    await dashboardHelpers.waitForSummaryStats();
    await dashboardHelpers.prepareForVisualTesting();
    
    // Take screenshot of just the summary statistics component
    await dashboardHelpers.expectElementVisualRegression(
      '[data-testid="summary-statistics"]',
      'dashboard-summary-stats'
    );
  });

  test('visual regression: activity feed', async ({ page }) => {
    await dashboardHelpers.waitForActivityFeed();
    await dashboardHelpers.prepareForVisualTesting();
    
    // Take screenshot of activity feed component
    await dashboardHelpers.expectElementVisualRegression(
      '[data-testid="activity-feed"]',
      'dashboard-activity-feed'
    );
  });

  test('responsive design: mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await dashboardHelpers.navigateToDashboard();
    await dashboardHelpers.prepareForVisualTesting();
    
    // Check that navigation adapts to mobile
    const navigation = dashboardHelpers.navigationBar;
    await expect(navigation).toBeVisible();
    
    // Take mobile screenshot
    await dashboardHelpers.expectVisualRegression('dashboard-home-mobile');
  });

  test('responsive design: tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await dashboardHelpers.navigateToDashboard();
    await dashboardHelpers.prepareForVisualTesting();
    
    // Take tablet screenshot with higher threshold for content differences
    await dashboardHelpers.expectVisualRegression('dashboard-home-tablet', {
      threshold: 0.25,
      maxDiffPixels: 20000
    });
  });
});