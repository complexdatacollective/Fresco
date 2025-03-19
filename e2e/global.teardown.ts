/* eslint-disable no-console */
/* eslint-disable no-process-env */
import { test as teardown } from '@playwright/test';
import { execSync } from 'child_process';
import { UTApi } from 'uploadthing/server';

teardown('delete test database', async ({ playwright, baseURL }) => {
  if (!process.env.CI) {
    // remove uploaded files from uploadthing
    // eslint-disable-next-line no-console
    console.log('🗑️ Deleting uploaded files from uploadthing');

    const utapi = new UTApi({
      // TODO: figure out why we cannot use getUTApi here
      token: process.env.E2E_UPLOADTHING_TOKEN,
    });

    await utapi.listFiles({}).then(({ files }) => {
      const keys = files.map((file) => file.key);
      return utapi.deleteFiles(keys);
    });

    // Stop and remove test db
    execSync('docker compose -f docker-compose.test.yml down -v', {
      stdio: 'inherit',
    });
  } else {
    console.log('🚮 Clearing cache');
    const requestContext = await playwright.request.newContext({
      baseURL,
    });
    try {
      await requestContext.get('/reset');
      console.log('✅ Application cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }

    await requestContext.dispose();
  }
});
