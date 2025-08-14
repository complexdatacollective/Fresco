import { type Page } from '@playwright/test';
import { test as authTest } from './auth';
import { BaseDashboardPage } from '~/tests/e2e/pages/dashboard/BaseDashboardPage';

/**
 * Functional test configuration options
 */
export type FunctionalTestConfig = {
  skipAuth?: boolean;
  timeout?: number;
  retries?: number;
  viewport?: { width: number; height: number };
};

/**
 * Functional test fixtures extending authentication and database fixtures
 */
type FunctionalFixtures = {
  functionalPage: Page;
  dashboardPage: BaseDashboardPage;
  setupFunctionalTest: (config?: FunctionalTestConfig) => Promise<void>;
  waitForPageStability: () => Promise<void>;
};

export const test = authTest.extend<FunctionalFixtures>({
  // Functional test page with extended timeouts and stability
  functionalPage: async ({ page }, providePage) => {
    // Set longer timeout for functional tests
    page.setDefaultTimeout(30000);

    // Set viewport for consistent functional testing
    await page.setViewportSize({ width: 1280, height: 720 });

    // Set up page for functional testing
    setupFunctionalTestPage(page);

    await providePage(page);
  },

  // Dashboard page object for functional tests
  dashboardPage: async ({ functionalPage }, provideDashboardPage) => {
    const dashboardPage = new (class extends BaseDashboardPage {
      getPagePath(): string {
        return '/dashboard';
      }
    })(functionalPage);

    await provideDashboardPage(dashboardPage);
  },

  // Setup function for functional tests
  setupFunctionalTest: async ({ functionalPage }, provideSetup) => {
    const setup = async (config: FunctionalTestConfig = {}) => {
      // Apply viewport if specified
      if (config.viewport) {
        await functionalPage.setViewportSize(config.viewport);
      }

      // Apply timeout if specified
      if (config.timeout) {
        functionalPage.setDefaultTimeout(config.timeout);
      }

      // Set up page stability
      await setupPageStability(functionalPage);

      // Handle authentication if not skipped
      if (!config.skipAuth) {
        await ensureAuthenticated(functionalPage);
      }
    };

    await provideSetup(setup);
  },

  // Wait for page stability (no pending requests, animations complete)
  waitForPageStability: async ({ functionalPage }, provideWaitForStability) => {
    const waitForStability = async () => {
      // Wait for network to be idle
      await functionalPage.waitForLoadState('networkidle');

      // Wait for any pending animations to complete
      await functionalPage.waitForTimeout(500);

      // Wait for fonts to load
      await functionalPage.waitForFunction(() => document.fonts.ready);

      // Wait for any dynamic content to stabilize
      await functionalPage.waitForFunction(
        () => {
          const loadingElements = document.querySelectorAll(
            '[data-loading="true"], .loading, .spinner',
          );
          return loadingElements.length === 0;
        },
        { timeout: 10000 },
      );
    };

    await provideWaitForStability(waitForStability);
  },
});

/**
 * Set up page for functional testing
 */
function setupFunctionalTestPage(page: Page): void {
  // Set up request/response logging for debugging
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      // eslint-disable-next-line no-console
      console.log(`→ ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', (response) => {
    if (response.url().includes('/api/')) {
      // eslint-disable-next-line no-console
      console.log(`← ${response.status()} ${response.url()}`);
    }
  });

  // Set up console logging
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      // eslint-disable-next-line no-console
      console.error(`Page error: ${msg.text()}`);
    }
  });

  // Set up error handling
  page.on('pageerror', (error) => {
    // eslint-disable-next-line no-console
    console.error(`Page error: ${error.message}`);
  });

  // Set up uncaught exception handling
  page.on('requestfailed', (request) => {
    // eslint-disable-next-line no-console
    console.error(`Request failed: ${request.url()}`);
  });
}

/**
 * Set up page stability for functional tests
 */
async function setupPageStability(page: Page): Promise<void> {
  // Add stability helpers to page
  await page.addInitScript(() => {
    // Track pending requests
    let pendingRequests = 0;

    // Override fetch to track requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      pendingRequests++;
      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        pendingRequests--;
      }
    };

    // Add global stability check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).isPageStable = (): boolean => {
      return (
        pendingRequests === 0 &&
        document.readyState === 'complete' &&
        document.fonts.status === 'loaded'
      );
    };

    // Add pending request count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).getPendingRequestCount = (): number => pendingRequests;
  });
}

/**
 * Ensure user is authenticated
 */
async function ensureAuthenticated(page: Page): Promise<void> {
  // Check if already authenticated
  try {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // If we're redirected to signin, we're not authenticated
    if (page.url().includes('/signin')) {
      throw new Error('Not authenticated');
    }
  } catch {
    // If navigation fails or we're not authenticated, this will be handled
    // by the test setup using the auth fixtures
  }
}

/**
 * Default functional test configuration
 */
export const defaultFunctionalConfig: FunctionalTestConfig = {
  skipAuth: false,
  timeout: 30000,
  retries: 2,
  viewport: { width: 1280, height: 720 },
};

/**
 * Mobile functional test configuration
 */
export const mobileFunctionalConfig: FunctionalTestConfig = {
  skipAuth: false,
  timeout: 30000,
  retries: 2,
  viewport: { width: 375, height: 812 },
};

/**
 * Tablet functional test configuration
 */
export const tabletFunctionalConfig: FunctionalTestConfig = {
  skipAuth: false,
  timeout: 30000,
  retries: 2,
  viewport: { width: 768, height: 1024 },
};

/**
 * Desktop functional test configuration
 */
export const desktopFunctionalConfig: FunctionalTestConfig = {
  skipAuth: false,
  timeout: 30000,
  retries: 2,
  viewport: { width: 1920, height: 1080 },
};
