/* eslint-disable no-process-env */
import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',

  retries: CI ? 2 : 0,
  workers: CI ? 4 : undefined,
  fullyParallel: false,

  reporter: CI
    ? [
        ['line'],
        ['html', { outputFolder: './playwright-report', open: 'never' }],
        ['github'],
      ]
    : [
        ['line'],
        ['html', { outputFolder: './playwright-report', open: 'never' }],
      ],

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
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
      fullyParallel: false,
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
      fullyParallel: true,
    },
  ],
});
