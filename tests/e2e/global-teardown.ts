import { clearContext } from './helpers/context.js';
import { log, logError } from './helpers/logger.js';

export default async function globalTeardown() {
  log('teardown', '=== E2E Global Teardown Starting ===');

  try {
    const servers = globalThis.__APP_SERVERS__ ?? [];
    for (const server of servers) {
      try {
        await server.stop();
      } catch (error) {
        logError('teardown', 'Failed to stop app server', error);
      }
    }

    const dbs = globalThis.__TEST_DBS__ ?? [];
    for (const db of dbs) {
      try {
        await db.stop();
      } catch (error) {
        logError('teardown', 'Failed to stop database', error);
      }
    }

    await clearContext();

    log('teardown', '=== E2E Global Teardown Complete ===');
  } catch (error) {
    logError('teardown', 'Global teardown failed', error);
  }
}
