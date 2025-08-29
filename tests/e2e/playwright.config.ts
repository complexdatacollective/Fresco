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
    {
      name: 'setup',
      testMatch: '**/setup/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.SETUP_URL,
      },
      fullyParallel: false, // Sequential for initial setup
    },
    {
      name: 'protocols',
      testMatch: '**/protocols/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PROTOCOLS_URL,
      },
      fullyParallel: true, // Parallel for protocol management tests
    },
    // {
    //   name: 'interviews',
    //   testMatch: '**/interviews/*.spec.ts',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     baseURL: process.env.INTERVIEWS_URL,
    //   },
    //   fullyParallel: false, // Sequential for interview flow
    // },
    // {
    //   name: 'participants',
    //   testMatch: '**/participants/*.spec.ts',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     baseURL: process.env.PARTICIPANTS_URL,
    //   },
    //   fullyParallel: true,
    // },
  ],

  // Global setup and teardown
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});
