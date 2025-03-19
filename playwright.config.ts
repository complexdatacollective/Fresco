import { defineConfig, devices } from '@playwright/test';

// Load environment variables
import dotenv from 'dotenv';
// eslint-disable-next-line no-process-env
const CI = process.env.CI;
dotenv.config({
  path: CI ? './.env' : './.env.test.local'
});

const PORT = 3001; // run on port 3001 to avoid conflicts with dev

const baseURL = CI
  // eslint-disable-next-line no-process-env
  ? process.env.BASE_URL
  : `http://localhost:${PORT}`;

const webServer = CI ?
undefined : {
  command: `NODE_ENV=test next start -p ${PORT}`,
  url: baseURL,
  reuseExistingServer: true
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'html',
  
  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'setup db',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'cleanup db',
      testMatch: /global\.teardown\.ts/,
    },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    //   dependencies: ['setup db'],
    //   teardown: 'cleanup db',
    // },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
       },
      dependencies: ['setup db'],
      teardown: 'cleanup db',
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup db'],
      teardown: 'cleanup db',
    },
  ],

  webServer,
});