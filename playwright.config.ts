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
    };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: env.CI ? [['github'], ['html']] : 'html',
  timeout: 20_000,
  expect: {
    timeout: 20_000,
  },
  workers: 1,
  retries: 0,
  maxFailures: env.CI ? 3 : 0,
  reportSlowTests: null,

  use: {
    baseURL,
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': env.VERCEL_AUTOMATION_BYPASS_SECRET ?? '',
      'x-vercel-set-bypass-cookie': 'true',
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
});
