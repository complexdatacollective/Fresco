import { defineConfig, devices } from '@playwright/test';
import { env } from 'process';

// Load environment variables
import dotenv from 'dotenv';
const CI = env.CI;
dotenv.config({
  path: CI ? './.env' : './.env.test.local',
});

const PORT = 3001; // run on port 3001 to avoid conflicts with dev

const baseURL = CI ? env.BASE_URL : `http://localhost:${PORT}`;

const webServer = CI
  ? undefined
  : {
      command: `NODE_ENV=test next start -p ${PORT}`,
      url: baseURL,
      reuseExistingServer: true,
      // Add timeout for server startup
      timeout: 120 * 1000,
    };

export default defineConfig({
  testDir: './e2e',
  // Disable parallel execution in CI to reduce flakiness
  fullyParallel: !CI,
  reporter: env.CI ? [['github'], ['html']] : 'html',

  // Increase timeouts for CI environments
  timeout: CI ? 60_000 : 30_000, // 60s for CI, 30s for local

  expect: {
    // Increase assertion timeout for CI
    timeout: CI ? 15_000 : 10_000, // 15s for CI, 10s for local
  },

  // Adjust workers based on environment
  workers: CI ? 1 : 2, // Single worker in CI for stability

  // Add retries for CI to handle transient failures
  retries: CI ? 2 : 0,

  maxFailures: env.CI ? 5 : 0, // Increased from 3 to allow more failures before stopping

  reportSlowTests: {
    max: 10,
    threshold: CI ? 30_000 : 15_000, // Report tests slower than 30s in CI
  },

  use: {
    baseURL,

    // Enhanced tracing for debugging
    trace: CI ? 'retain-on-failure' : 'on-first-retry',

    // Capture screenshots on failure
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },

    // Capture videos in CI for debugging
    video: CI ? 'retain-on-failure' : 'off',

    // Increase action timeout for slow CI runners
    actionTimeout: CI ? 15_000 : 10_000, // 15s for CI, 10s for local

    // Navigation timeout
    navigationTimeout: CI ? 45_000 : 30_000, // 45s for CI, 30s for local

    // Add viewport size for consistency
    viewport: { width: 1280, height: 720 },

    // Ensure consistent timezone
    timezoneId: 'UTC',

    // Browser context options
    contextOptions: {
      reducedMotion: 'reduce',
      // Add permissions if needed
      permissions: ['clipboard-read', 'clipboard-write'],
    },

    extraHTTPHeaders: {
      'x-vercel-protection-bypass': env.VERCEL_AUTOMATION_BYPASS_SECRET ?? '',
      'x-vercel-set-bypass-cookie': 'true',
      'x-vercel-skip-toolbar': '1', // disable vercel toolbar
    },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'teardown',
    },
    {
      name: 'e2e tests',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'e2e/.auth/user.json',
        // Browser-specific settings for stability
        launchOptions: {
          // Slow down browser actions in CI
          slowMo: CI ? 100 : 0,
        },
        contextOptions: {
          reducedMotion: 'reduce',
        },
      },
      dependencies: ['setup'],
      teardown: 'teardown',
    },
    {
      name: 'teardown',
      testMatch: /global\.teardown\.ts/,
    },
  ],

  webServer,

  // Global timeout for the entire test run
  globalTimeout: CI ? 30 * 60 * 1000 : 10 * 60 * 1000, // 30 min for CI, 10 min for local

  // Preserve test artifacts
  preserveOutput: 'failures-only',

  // Quiet mode in CI to reduce log noise
  quiet: !!CI,
});
