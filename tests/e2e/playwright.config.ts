/* eslint-disable no-process-env */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  snapshotDir: './visual-snapshots',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{arg}{ext}',

  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,

  reporter: [
    ['line'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],

  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixels: 250,
    },
  },

  use: {
    baseURL: process.env.E2E_APP_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    viewport: { width: 1920, height: 1080 },
    contextOptions: { reducedMotion: 'reduce' },
  },

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
  ],
});
