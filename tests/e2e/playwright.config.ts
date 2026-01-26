import { defineConfig, devices } from '@playwright/test';

// For test configuration, access env vars directly but safely
const getEnvVar = (name: string): string | undefined => {
  try {
    // eslint-disable-next-line no-process-env
    return process.env[name];
  } catch {
    return undefined;
  }
};

export default defineConfig({
  testDir: './suites',
  fullyParallel: false, // We'll control parallelization per project
  forbidOnly: !!getEnvVar('CI'),
  retries: getEnvVar('CI') ? 2 : 0,
  workers: getEnvVar('CI') ? 4 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['line'],
    ['github'],
  ],

  use: {
    // Global test settings
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Increase timeouts for container startup
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // Setup project for initial app configuration tests
    {
      name: 'setup',
      testMatch: '**/setup/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // This URL is provided by testEnv.create() which is called in global-setup
        baseURL: getEnvVar('SETUP_URL'),
      },
      fullyParallel: false, // Sequential for initial setup
    },

    // Auth setup project - runs once to create auth state for dashboard tests
    {
      name: 'auth-dashboard',
      testMatch: '**/auth/dashboard-setup.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: getEnvVar('DASHBOARD_URL'),
      },
    },

    // Visual snapshot tests - run first to capture initial state before data modifications
    {
      name: 'dashboard-visual',
      testMatch: '**/dashboard/visual-snapshots.spec.ts',
      dependencies: ['auth-dashboard'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: getEnvVar('DASHBOARD_URL'),
        storageState: 'tests/e2e/.auth/admin.json',
      },
      fullyParallel: true,
    },

    // Dashboard tests - depend on visual tests completing first
    {
      name: 'dashboard',
      testMatch: '**/dashboard/*.spec.ts',
      testIgnore: '**/dashboard/visual-snapshots.spec.ts', // Handled by dashboard-visual
      dependencies: ['dashboard-visual'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: getEnvVar('DASHBOARD_URL'),
        // Use stored auth state
        storageState: 'tests/e2e/.auth/admin.json',
      },
      fullyParallel: true, // Parallel for protocol management tests
    },

    // Interview tests - depend on auth setup
    {
      name: 'interview',
      testMatch: '**/interview/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: getEnvVar('INTERVIEW_URL'),
        // Use stored auth state
      },
      fullyParallel: false, // Sequential for interview flow
    },
  ],

  // Global setup and teardown
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});
