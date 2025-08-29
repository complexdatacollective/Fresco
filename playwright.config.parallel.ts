/* eslint-disable no-process-env, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-explicit-any */
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for parallel test execution in Docker
 * This config supports running different test suites in parallel pods
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: true,

  /* Retry on CI */
  retries: 2,

  /* Number of workers per pod */
  workers: process.env.PARALLEL_WORKERS
    ? parseInt(process.env.PARALLEL_WORKERS)
    : 4,

  /* Reporter configuration */
  reporter: [
    [
      'html',
      {
        outputFolder: `playwright-report/${process.env.TEST_SUITE || 'default'}`,
        open: 'never',
      },
    ],
    ['line'],
    [
      'json',
      {
        outputFile: `test-results/${process.env.TEST_SUITE || 'default'}-results.json`,
      },
    ],
    [
      'junit',
      {
        outputFile: `test-results/${process.env.TEST_SUITE || 'default'}-junit.xml`,
      },
    ],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions */
    baseURL: process.env.BASE_URL || 'http://nextjs_app:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },

    /* Video on failure */
    video: 'retain-on-failure',

    /* Timeout for each test */
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  /* Configure test timeout */
  timeout: 60000,

  /* Configure expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Configure projects based on TEST_SUITE environment variable */
  projects: (() => {
    const suite = process.env.TEST_SUITE || 'all';
    const browser = process.env.TEST_BROWSER || 'chromium';

    const allProjects: Record<string, any[]> = {
      auth: [
        {
          name: `auth-${browser}`,
          use: {
            ...devices[
              browser === 'chromium'
                ? 'Desktop Chrome'
                : browser === 'firefox'
                  ? 'Desktop Firefox'
                  : 'Desktop Safari'
            ],
            storageState: undefined,
          },
          testMatch: /auth\/.*.spec.ts/,
        },
      ],
      dashboard: [
        {
          name: `dashboard-${browser}`,
          use: {
            ...devices[
              browser === 'chromium'
                ? 'Desktop Chrome'
                : browser === 'firefox'
                  ? 'Desktop Firefox'
                  : 'Desktop Safari'
            ],
          },
          testMatch: /dashboard\/.*.spec.ts/,
        },
      ],
      interview: [
        {
          name: `interview-${browser}`,
          use: {
            ...devices[
              browser === 'chromium'
                ? 'Desktop Chrome'
                : browser === 'firefox'
                  ? 'Desktop Firefox'
                  : 'Desktop Safari'
            ],
          },
          testMatch: /interview\/.*.spec.ts/,
        },
      ],
    };

    if (suite === 'all') {
      // Return all browser projects
      return [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ];
    }

    return allProjects[suite] || allProjects.auth;
  })(),

  /* Configure snapshot paths */
  snapshotPathTemplate:
    '{testDir}/__screenshots__/{testFilePath}/{testName}/{projectName}/{arg}{ext}',
  snapshotDir: 'tests/e2e/__screenshots__',

  /* Global setup and teardown */
  globalSetup: process.env.SKIP_GLOBAL_SETUP
    ? undefined
    : './tests/e2e/global-setup.ts',
  globalTeardown: process.env.SKIP_GLOBAL_TEARDOWN
    ? undefined
    : './tests/e2e/global-teardown.ts',

  /* Don't start webserver in Docker - the app is already running */
  webServer: undefined,
});
