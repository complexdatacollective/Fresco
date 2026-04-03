import { AppServer } from './helpers/appServer.js';
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

    // Stop the asset server
    const assetServer = globalThis.__ASSET_SERVER__;
    if (assetServer) {
      try {
        await assetServer.stop();
      } catch (error) {
        logError('teardown', 'Failed to stop asset server', error);
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

    // Remove the standalone build copy from /tmp
    AppServer.cleanupBuild();

    await clearContext();

    log('teardown', '=== E2E Global Teardown Complete ===');
  } catch (error) {
    logError('teardown', 'Global teardown failed', error);
  }
}
