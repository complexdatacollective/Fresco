import { type FullConfig } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalTeardown(_config: FullConfig) {
  // eslint-disable-next-line no-console
  console.log('🧹 Starting global test teardown...');

  // eslint-disable-next-line no-process-env
  const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

  // Clean up test data if in test environment
  // eslint-disable-next-line no-process-env
  if (process.env.NODE_ENV === 'test' || process.env.CI === 'true') {
    try {
      // eslint-disable-next-line no-console
      console.log('🗑️  Cleaning up test data...');
      const response = await fetch(`${baseURL}/api/test/seed`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // eslint-disable-next-line no-console
        console.log('✅ Test data cleaned up successfully');
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          '⚠️  Failed to clean up test data:',
          await response.text(),
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('⚠️  Could not clean up test data:', error);
    }
  }

  // eslint-disable-next-line no-console
  console.log('✅ Global teardown completed');
}

export default globalTeardown;
