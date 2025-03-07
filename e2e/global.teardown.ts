import { test as teardown } from '@playwright/test';
import { execSync } from 'child_process';
import { UTApi } from 'uploadthing/server';

teardown('delete test database', async () => {
  // remove uploaded files from uploadthing
  // eslint-disable-next-line no-console
  console.log('🗑️ Deleting uploaded files from uploadthing');
  const utapi = new UTApi({
    // TODO: figure out why we cannot use getUTApi here
    // eslint-disable-next-line no-process-env
    token: process.env.E2E_UPLOADTHING_TOKEN,
  });

  await utapi.listFiles({}).then(({ files }) => {
    const keys = files.map((file) => file.key);
      return utapi.deleteFiles(keys);
  });

  // Stop and remove test db
  execSync('docker compose -f docker-compose.test.yml down -v', { stdio: 'inherit' });
});
