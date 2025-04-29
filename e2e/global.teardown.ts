/* eslint-disable no-console */
/* eslint-disable no-process-env */
import { chromium, type FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { UTApi } from 'uploadthing/server';

export default async function globalTeardown(config: FullConfig) {
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
    const { baseURL } = config.projects[1]?.use ?? {};

    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log('🚮 Clearing cache');
    try {
      await page.goto(baseURL!);
      console.log('✅ Application cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}
