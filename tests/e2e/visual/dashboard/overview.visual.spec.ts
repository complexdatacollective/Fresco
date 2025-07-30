// tests/e2e/visual/dashboard/overview.visual.spec.ts
import { test } from '~/tests/e2e/fixtures/visual';

test.describe('Dashboard Overview - Visual Tests', () => {
  test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
    void dashboardData; // Ensure data is loaded
    await setupVisualTest();
  });

  test('should render dashboard overview correctly', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard');

    // Wait for all dashboard components to load
    await visualHelper.waitForElements([
      '[data-testid="summary-statistics"]',
      '[data-testid="activity-feed"]',
      '[data-testid="navigation-bar"]',
    ]);

    // Mask dynamic content
    await visualHelper.maskDynamicContent([
      '[data-testid="activity-feed-timestamp"]',
      '[data-testid="last-updated"]',
    ]);

    // Take full page screenshot
    await visualHelper.screenshotPage('dashboard-overview');
  });

  test('should render summary statistics correctly', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard');

    await visualHelper.waitForElements(['[data-testid="summary-statistics"]']);
    await visualHelper.screenshotElement(
      '[data-testid="summary-statistics"]',
      'dashboard-summary-stats',
    );
  });

  test('should render activity feed correctly', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard');

    await visualHelper.waitForElements(['[data-testid="activity-feed"]']);

    // Mask timestamps in activity feed
    await visualHelper.maskDynamicContent([
      '[data-testid="activity-timestamp"]',
    ]);

    await visualHelper.screenshotElement(
      '[data-testid="activity-feed"]',
      'dashboard-activity-feed',
    );
  });

  test('should render navigation correctly', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard');

    const navSelector = '[data-testid="navigation-bar"]';
    await visualHelper.waitForElements([navSelector]);
    await visualHelper.screenshotElement(navSelector, 'nav-dashboard');
  });
});
