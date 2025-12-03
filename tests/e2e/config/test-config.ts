/**
 * Centralized test configuration
 * All test credentials and common settings should be defined here
 */

export const TEST_CONFIG = {
  // Admin user credentials - used across all test environments
  admin: {
    username: 'testadmin',
    password: 'TestAdmin123!',
  },

  // Test timeouts
  timeouts: {
    containerStartup: 180000, // 3 minutes
    appInitialization: 10000, // 10 seconds
    navigation: 30000, // 30 seconds
  },

  // Test environment settings
  environment: {
    // Whether to skip environment validation in containers
    skipEnvValidation: true,
    // Test UploadThing token
    uploadThingToken: 'sk_test_dummy_token_for_testing',
  },
} as const;

// Export individual parts for convenience
export const ADMIN_CREDENTIALS = TEST_CONFIG.admin;
export const TEST_TIMEOUTS = TEST_CONFIG.timeouts;
export const TEST_ENVIRONMENT = TEST_CONFIG.environment;
