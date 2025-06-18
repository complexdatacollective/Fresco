import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import './envConfig.js';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/test-results',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI and for database tests
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: './tests/e2e/playwright-report' }],
    ['json', { outputFile: './tests/e2e/test-results.json' }],
    ['github'],
  ],

  // Shared settings for all the projects below
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Global setup and teardown
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  // Run your local dev server before starting the tests
  webServer: {
    command: 'pnpm run dev:test',
    url: process.env.PLAYWRIGHT_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
