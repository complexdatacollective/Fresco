/* eslint-disable no-process-env */
import { defineConfig } from '@playwright/test';
import { getProjects } from './config/test-config.js';

// When running browsers in parallel Docker containers, each sets E2E_OUTPUT_DIR
// to a per-browser subdirectory so reports and artifacts don't overwrite each other.
const outputDir = process.env.E2E_OUTPUT_DIR ?? './test-results';
const reportDir = process.env.E2E_OUTPUT_DIR
  ? `${process.env.E2E_OUTPUT_DIR}/playwright-report`
  : './playwright-report';

export default defineConfig({
  testDir: './specs',
  outputDir,
  snapshotDir: './visual-snapshots',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{arg}{ext}',

  retries: 0,
  fullyParallel: false,

  reporter: [
    ['line'],
    ['html', { outputFolder: reportDir, open: 'never' }],
    ['json', { outputFile: `${outputDir}/results.json` }],
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },

  timeout: 60_000,

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    viewport: { width: 1920, height: 1080 },
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  projects: getProjects(),
});
