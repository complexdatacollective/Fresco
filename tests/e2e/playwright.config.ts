/* eslint-disable no-process-env */
import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',

  retries: 0,
  // Multiple workers coordinate via shared/exclusive advisory locks:
  // - Read-only tests hold shared locks (parallel reads allowed)
  // - Mutation tests acquire exclusive locks (serialized writes)
  fullyParallel: false,

  reporter: [
    ['line'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },

  // Extended timeout to account for mutation tests waiting on exclusive locks
  timeout: 60_000,

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  projects: [
    {
      name: 'setup',
      testMatch: '**/setup/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.SETUP_URL,
      },
    },
    {
      name: 'auth',
      testMatch: '**/auth/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.DASHBOARD_URL,
      },
    },
    {
      name: 'dashboard',
      testMatch: '**/dashboard/*.spec.ts',
      dependencies: ['auth'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.DASHBOARD_URL,
        storageState: './tests/e2e/.auth/admin.json',
      },
    },
  ],
});
