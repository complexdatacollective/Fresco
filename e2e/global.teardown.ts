/* eslint-disable no-console */
/* eslint-disable no-process-env */
import { execSync } from 'child_process';
import { UTApi } from 'uploadthing/server';

export default async function globalTeardown() {
  if (!process.env.CI) {
    // remove uploaded files from uploadthing
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
  }
}
