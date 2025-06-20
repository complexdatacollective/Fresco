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
  // eslint-disable-next-line no-process-env
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  // eslint-disable-next-line no-process-env
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI and for database tests
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: './tests/e2e/playwright-report' }],
    ['json', { outputFile: './tests/e2e/test-results.json' }],
    ['github'],
  ],

  // Visual testing configuration
  expect: {
    // Global screenshot comparison threshold
    toHaveScreenshot: {
      threshold: 0.2, // 20% threshold for pixel differences
      maxDiffPixels: 1000, // Maximum number of different pixels allowed
      animations: 'disabled', // Disable animations for consistent screenshots
    },
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixels: 1000,
    },
  },

  // Shared settings for all the projects below
  use: {
    // eslint-disable-next-line no-process-env
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Ensure consistent screenshot timing
    actionTimeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }, // Fixed viewport for consistency
        deviceScaleFactor: 1, // Consistent pixel density
        contextOptions: {
          reducedMotion: 'reduce', // Prevent issues with animations
        },
      },
      testMatch: '**/*.visual.spec.ts',
    },
    // {
    //   name: 'firefox-visual',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     viewport: { width: 1280, height: 720 },
    //     deviceScaleFactor: 1,
    //   },
    //   testMatch: '**/*.visual.spec.ts',
    // },
    // {
    //   name: 'mobile-visual',
    //   use: {
    //     ...devices['iPhone 12'],
    //     viewport: { width: 390, height: 844 },
    //     deviceScaleFactor: 1,
    //   },
    //   testMatch: '**/*.mobile-visual.spec.ts',
    // },
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
  globalSetup: './tests/e2e/global.setup.ts',
  globalTeardown: './tests/e2e/global.teardown.ts',
});
