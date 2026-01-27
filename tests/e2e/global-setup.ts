/* eslint-disable no-process-env */
import { AppServer, resetPortAllocation } from './helpers/AppServer.js';
import { type SuiteContext, saveContext } from './helpers/context.js';
import { log, logError } from './helpers/logger.js';
import {
  seedDashboardEnvironment,
  seedSetupEnvironment,
} from './helpers/seed.js';
import { TestDatabase } from './helpers/TestDatabase.js';

declare global {
   
  var __TEST_DBS__: TestDatabase[];
   
  var __APP_SERVERS__: AppServer[];
}

async function startEnvironment(
  suiteId: string,
  seedFn: (connectionUri: string) => Promise<void>,
): Promise<{ db: TestDatabase; server: AppServer; context: SuiteContext }> {
  const db = await TestDatabase.start();
  db.runMigrations();
  await seedFn(db.connectionUri);

  const server = await AppServer.start({
    suiteId,
    databaseUrl: db.connectionUri,
  });

  await db.createSnapshot(suiteId, 'initial');

  return {
    db,
    server,
    context: {
      suiteId,
      appUrl: server.url,
      databaseUrl: db.connectionUri,
    },
  };
}

export default async function globalSetup() {
  log('setup', '=== E2E Global Setup Starting ===');

  try {
    resetPortAllocation();
    AppServer.ensureBuild();

    const [setupEnv, dashboardEnv] = await Promise.all([
      startEnvironment('setup', seedSetupEnvironment),
      startEnvironment('dashboard', seedDashboardEnvironment),
    ]);

    await saveContext({
      setup: setupEnv.context,
      dashboard: dashboardEnv.context,
    });

    process.env.SETUP_URL = setupEnv.server.url;
    process.env.DASHBOARD_URL = dashboardEnv.server.url;

    globalThis.__TEST_DBS__ = [setupEnv.db, dashboardEnv.db];
    globalThis.__APP_SERVERS__ = [setupEnv.server, dashboardEnv.server];

    log('setup', '=== E2E Global Setup Complete ===');
    log('setup', `Setup URL: ${setupEnv.server.url}`);
    log('setup', `Dashboard URL: ${dashboardEnv.server.url}`);
  } catch (error) {
    logError('setup', 'Global setup failed', error);
    throw error;
  }
}
