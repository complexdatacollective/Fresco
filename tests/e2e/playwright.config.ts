import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './suites',
  fullyParallel: false, // We'll control parallelization per project
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['line'],
    ['github'],
  ],

  use: {
    // Global test settings
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Increase timeouts for container startup
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // Setup project for initial app configuration tests
    {
      name: 'setup',
      testMatch: '**/setup/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // This URL is provided by testEnv.create() which is called in global-setup
        baseURL: process.env.SETUP_URL,
      },
      fullyParallel: false, // Sequential for initial setup
    },

    // Auth setup project - runs once to create auth state for dashboard tests
    {
      name: 'auth-dashboard',
      testMatch: '**/auth/dashboard-setup.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.DASHBOARD_URL,
      },
    },

    // Dashboard tests - depend on auth setup
    {
      name: 'dashboard',
      testMatch: '**/dashboard/*.spec.ts',
      dependencies: ['auth-dashboard'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.DASHBOARD_URL,
        // Use stored auth state
        storageState: 'tests/e2e/.auth/admin.json',
      },
      fullyParallel: true, // Parallel for protocol management tests
    },

    // Interview tests - depend on auth setup
    {
      name: 'interviews',
      testMatch: '**/interviews/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.INTERVIEWS_URL,
        // Use stored auth state
      },
      fullyParallel: false, // Sequential for interview flow
    },
  ],

  // Global setup and teardown
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});
