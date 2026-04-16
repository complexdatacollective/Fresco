import { defineConfig } from '@playwright/test';
import { getProjects } from './config/test-config.js';

export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',
  snapshotDir: './visual-snapshots',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{arg}{ext}',

  retries: 0,
  fullyParallel: false,
  workers: 3,

  reporter: [
    ['line'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      // Different GPUs do aliasing differently, so allow a small amount of pixel difference for CI screenshots.
      maxDiffPixels: 250,
    },
  },

  timeout: 30_000,

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    viewport: { width: 1920, height: 1080 },
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  projects: getProjects(),
});
