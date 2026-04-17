import { createId } from '@paralleldrive/cuid2';
import pg from 'pg';
import { log } from './logger.js';

export async function seedAppSettings(connectionUri: string): Promise<void> {
  log('setup', 'Seeding minimal AppSettings...');
  const client = new pg.Client({ connectionString: connectionUri });
  await client.connect();

  const rows: { key: string; value: string }[] = [
    { key: 'configured', value: 'true' },
    { key: 'allowAnonymousRecruitment', value: 'true' },
    { key: 'limitInterviews', value: 'false' },
    { key: 'disableAnalytics', value: 'true' },
    { key: 'installationId', value: `e2e-${createId()}` },
    { key: 'initializedAt', value: new Date().toISOString() },
    { key: 'uploadThingToken', value: 'TEST_TOKEN' },
    { key: 'disableSmallScreenOverlay', value: 'false' },
    { key: 'previewModeRequireAuth', value: 'true' },
  ];

  try {
    for (const row of rows) {
      await client.query(
        `INSERT INTO "AppSettings" ("key", "value") VALUES ($1, $2)
         ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value"`,
        [row.key, row.value],
      );
    }
    log('setup', `AppSettings seeded (${rows.length} keys)`);
  } finally {
    await client.end();
  }
}
