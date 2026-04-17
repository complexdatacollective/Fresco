import { log, logError } from './helpers/logger.js';

export default async function globalTeardown() {
  log('teardown', '=== E2E Global Teardown Starting ===');
  const state = globalThis.__E2E__;
  if (!state) {
    log('teardown', 'No global state found, nothing to tear down');
    return;
  }
  const { db, app, asset } = state;

  try {
    await app.stop();
  } catch (error) {
    logError('teardown', 'Failed to stop app server', error);
  }
  try {
    await asset.stop();
  } catch (error) {
    logError('teardown', 'Failed to stop asset server', error);
  }
  try {
    await db.stop();
  } catch (error) {
    logError('teardown', 'Failed to stop database', error);
  }

  log('teardown', '=== E2E Global Teardown Complete ===');
}
