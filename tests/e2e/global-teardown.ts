import { clearContextData } from './fixtures/context-storage';
import { logger } from './utils/logger';

async function globalTeardown() {
  logger.teardown.start();

  const testEnv = globalThis.__TEST_ENVIRONMENT__;
  if (testEnv) {
    await testEnv.cleanupAll();
  }

  // Clean up the context data file
  await clearContextData();

  logger.teardown.complete();
}

export default globalTeardown;
