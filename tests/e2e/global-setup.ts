import { type FullConfig } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalSetup(_config: FullConfig) {
  // eslint-disable-next-line no-console
  console.log('🚀 Starting global test setup...');

  // eslint-disable-next-line no-process-env
  const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

  // Wait for the application to be ready
  const maxRetries = 30;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(`${baseURL}/api/health`);
      if (response.ok) {
        const data = await response.json();
        // eslint-disable-next-line no-console
        console.log('✅ Application is healthy:', data);
        break;
      }
    } catch (error) {
      // Server not ready yet
    }

    retries++;
    if (retries === maxRetries) {
      throw new Error(
        `Application at ${baseURL} is not responding after ${maxRetries} attempts`,
      );
    }

    // eslint-disable-next-line no-console
    console.log(
      `⏳ Waiting for application to be ready... (${retries}/${maxRetries})`,
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Reset database to clean state if in test environment
  // eslint-disable-next-line no-process-env
  if (process.env.NODE_ENV === 'test' || process.env.CI === 'true') {
    try {
      // eslint-disable-next-line no-console
      console.log('🗑️  Resetting test database...');
      const response = await fetch(`${baseURL}/api/test/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (response.ok) {
        // eslint-disable-next-line no-console
        console.log('✅ Test database reset successfully');
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          '⚠️  Failed to reset test database:',
          await response.text(),
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('⚠️  Could not reset test database:', error);
    }
  }

  // eslint-disable-next-line no-console
  console.log('✅ Global setup completed');
}

export default globalSetup;
