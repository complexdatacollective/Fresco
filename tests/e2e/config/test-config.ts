/**
 * Centralized test configuration
 * All test credentials and common settings should be defined here
 */

const TEST_CONFIG = {
  // Admin user credentials - used across all test environments
  admin: {
    username: 'testadmin',
    password: 'TestAdmin123!',
  },
  // Native app settings for running Next.js without Docker
  nativeApp: {
    // Starting port for native app instances
    basePort: 3100,
    // Maximum age of standalone build before rebuilding (1 hour)
    maxBuildAgeMs: 3600000,
    // Interval between health check polls
    healthCheckPollMs: 500,
    // Timeout waiting for app to be ready
    healthCheckTimeoutMs: 60000,
    // Timeout waiting for graceful shutdown before force kill
    shutdownTimeoutMs: 5000,
  },
} as const;

// Export individual parts for convenience
export const ADMIN_CREDENTIALS = TEST_CONFIG.admin;
export const NATIVE_APP_CONFIG = TEST_CONFIG.nativeApp;

/**
 * Context mappings for test resolution
 * Maps test suite directories and Playwright project names to context identifiers
 */
export const CONTEXT_MAPPINGS = {
  // Maps suite directory names (tests/e2e/suites/<name>/) to context identifiers
  suiteToContext: {
    setup: 'setup',
    dashboard: 'dashboard',
    interview: 'interview',
    auth: 'dashboard',
  },
  // Maps Playwright project names to context identifiers
  projectToContext: {
    'setup': 'setup',
    'auth-dashboard': 'dashboard',
    'dashboard': 'dashboard',
    'dashboard-visual': 'dashboard',
    'interview': 'interview',
  },
} as const;
