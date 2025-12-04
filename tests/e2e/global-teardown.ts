import { logger } from './utils/logger';

async function globalTeardown() {
  logger.teardown.start();

  const testEnv = globalThis.__TEST_ENVIRONMENT__;
  if (testEnv) {
    await testEnv.cleanupAll();
  }

  logger.teardown.complete();
}

export default globalTeardown;
