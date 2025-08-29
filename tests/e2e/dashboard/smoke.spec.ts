import { expect, test } from '@playwright/test';
import { AuthHelper } from '../utils/auth-helper';
import { DashboardHelpers } from '../utils/dashboard-helpers';
import { AccessibilityHelper } from '../utils/accessibility-helper';

test.describe('Dashboard Smoke Tests', () => {
  let dashboardHelpers: DashboardHelpers;
  let authHelper: AuthHelper;
  let accessibilityHelper: AccessibilityHelper;

  test.beforeEach(async ({ page }) => {
    dashboardHelpers = new DashboardHelpers(page);
    authHelper = new AuthHelper(page);
    accessibilityHelper = new AccessibilityHelper(page);
  });

  test('authentication flow and dashboard access', async ({ page }) => {
    // Start from login page
    await page.goto('/signin');

    // Should be able to access dashboard after authentication
    await authHelper.ensureAuthenticated();
    await expect(page).toHaveURL(/\/dashboard/);

    // Should see dashboard content - specifically target the main dashboard heading
    await expect(page.locator('h1').first()).toContainText(
      /dashboard|overview/i,
    );
  });

  test('dashboard navigation smoke test', async ({ page }) => {
    await dashboardHelpers.navigateToDashboard();

    const dashboardPages = [
      { name: 'Dashboard Home', url: '/dashboard', selector: 'h1' },
      { name: 'Protocols', url: '/dashboard/protocols', selector: 'h1' },
      { name: 'Participants', url: '/dashboard/participants', selector: 'h1' },
      { name: 'Interviews', url: '/dashboard/interviews', selector: 'h1' },
      { name: 'Settings', url: '/dashboard/settings', selector: 'h1' },
    ];

    for (const dashboardPage of dashboardPages) {
      await page.goto(dashboardPage.url);
      await dashboardHelpers.waitForPageLoad();

      // Verify page loaded correctly
      await expect(page).toHaveURL(new RegExp(dashboardPage.url));
      // Use first() to avoid strict mode violation with multiple h1 elements
      await expect(page.locator(dashboardPage.selector).first()).toBeVisible();
    }
  });

  test('basic functionality smoke test', async ({ page }) => {
    // Test that key interactive elements are working
    await dashboardHelpers.navigateToDashboard();

    // Navigation should be functional
    const navLinks = page.locator('nav a, [role="navigation"] a');
    const navCount = await navLinks.count();
    expect(navCount).toBeGreaterThan(0);

    // User menu should be accessible
    const userMenuTrigger = page.locator(
      '[data-testid="user-menu"], .user-menu, button[aria-label*="user"]',
    );

    if ((await userMenuTrigger.count()) > 0) {
      await userMenuTrigger.first().click();

      // Should show menu options
      const menuItems = page.locator(
        '[role="menu"] [role="menuitem"], .menu-item',
      );
      if ((await menuItems.count()) > 0) {
        await expect(menuItems.first()).toBeVisible();

        // Click outside to close menu
        await page.click('body');
      }
    }
  });

  test('page load performance', async ({ page }) => {
    const pages = [
      '/dashboard',
      '/dashboard/protocols',
      '/dashboard/participants',
      '/dashboard/interviews',
      '/dashboard/settings',
    ];

    for (const pagePath of pages) {
      const startTime = Date.now();

      await page.goto(pagePath);
      await dashboardHelpers.waitForPageLoad();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Page should load within reasonable time (10 seconds)
      expect(loadTime).toBeLessThan(10000);

      // Page should be interactive
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('responsive layout smoke test', async ({ page }) => {
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await dashboardHelpers.navigateToDashboard();

      // Navigation should be present and functional
      const navigation = dashboardHelpers.navigationBar;
      await expect(navigation).toBeVisible();

      // Main content should be visible (check for dashboard page header or summary stats)
      const mainContent = page.locator('[data-testid="dashboard-page-header"], [data-testid="summary-statistics"]');
      await expect(mainContent.first()).toBeVisible();

      // Check for proper mobile layout (strict mobile responsiveness)
      if (viewport.width <= 768) {
        const bodyWidth = await page
          .locator('body')
          .evaluate((el) => el.scrollWidth);
        
        // Strict mobile layout check with minimal tolerance
        const maxAllowedWidth = viewport.width + 20; // Allow only minimal overflow for scrollbars
        
        if (bodyWidth > maxAllowedWidth) {
          // Log details for debugging
          const overflowAmount = bodyWidth - viewport.width;
          console.error(`Mobile layout overflow: ${overflowAmount}px overflow on ${viewport.width}px viewport`);
          
          // Check for common causes of overflow
          const wideElements = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            return elements
              .filter(el => el.scrollWidth > window.innerWidth)
              .map(el => ({
                tag: el.tagName,
                class: el.className,
                id: el.id,
                width: el.scrollWidth
              }))
              .slice(0, 3); // Top 3 problematic elements
          });
          
          console.error('Elements causing overflow:', wideElements);
          
          // Fail the test - mobile layouts should be responsive
          expect(bodyWidth).toBeLessThanOrEqual(maxAllowedWidth);
        }
      }
    }
  });

  test('accessibility smoke test', async ({ page }) => {
    await dashboardHelpers.navigateToDashboard();

    // Run comprehensive accessibility check
    await accessibilityHelper.runFullAccessibilityCheck();

    // Additional dashboard-specific accessibility checks
    
    // Check navigation accessibility
    const nav = page.locator('[data-testid="navigation-bar"]');
    if ((await nav.count()) > 0) {
      await expect(nav).toBeVisible();
    }

    // Check main content areas have proper structure
    const summaryStats = page.locator('[data-testid="summary-statistics"]');
    if ((await summaryStats.count()) > 0) {
      await expect(summaryStats).toBeVisible();
    }

    // Check that dashboard page header is properly structured
    const pageHeader = page.locator('[data-testid="dashboard-page-header"]');
    if ((await pageHeader.count()) > 0) {
      const headerH1 = pageHeader.locator('h1');
      if ((await headerH1.count()) > 0) {
        await expect(headerH1.first()).toBeVisible();
      }
    }
  });
});
