/* eslint-disable no-process-env */
import path from 'node:path';
import {
  AppServer,
  allocatePort,
  resetPortAllocation,
} from './helpers/appServer.js';
import { AssetServer, ASSET_SERVER_PORT } from './helpers/assetServer.js';
import { type SuiteContext, saveContext } from './helpers/context.js';
import { log, logError } from './helpers/logger.js';
import {
  seedDashboardEnvironment,
  seedSetupEnvironment,
} from './helpers/seed.js';
import { TestDatabase } from './helpers/testDatabase.js';
import { envUrlVar, getEnvironmentInstances } from './config/test-config.js';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');
const E2E_ASSETS_DIR = path.join(PROJECT_ROOT, '.e2e-assets');

const SEED_FUNCTIONS: Record<string, (connectionUri: string) => Promise<void>> =
  {
    setup: seedSetupEnvironment,
    dashboard: seedDashboardEnvironment,
    api: seedDashboardEnvironment, // Reuse dashboard seed (configured app with data, but no auth)
    interview: seedDashboardEnvironment, // Reuse dashboard seed (configured app with data, but no auth)
    preview: seedDashboardEnvironment, // Reuse dashboard seed (configured app for protocol preview tests)
  };

declare global {
  var __TEST_DBS__: TestDatabase[];
  var __APP_SERVERS__: AppServer[];
  var __ASSET_SERVER__: AssetServer | undefined;
}

async function startEnvironment(
  suiteId: string,
  port: number,
  seedFn: (connectionUri: string) => Promise<void>,
  assetServerUrl: string,
): Promise<{ db: TestDatabase; server: AppServer; context: SuiteContext }> {
  const db = await TestDatabase.start();
  db.runMigrations();
  await seedFn(db.connectionUri);

  const server = await AppServer.start({
    suiteId,
    port,
    databaseUrl: db.connectionUri,
  });

  db.suiteId = suiteId;
  await db.createSnapshot('initial');

  return {
    db,
    server,
    context: {
      suiteId,
      appUrl: server.url,
      databaseUrl: db.connectionUri,
      assetServerUrl,
    },
  };
}

export default async function globalSetup() {
  log('setup', '=== E2E Global Setup Starting ===');

  try {
    resetPortAllocation();
    AppServer.ensureBuild();

    // Start the asset server (shared by all environments)
    const assetServer = await AssetServer.start(
      E2E_ASSETS_DIR,
      ASSET_SERVER_PORT,
    );
    globalThis.__ASSET_SERVER__ = assetServer;

    const instances = getEnvironmentInstances();
    // Pre-allocate ports synchronously before starting any async work.
    // Promise.all starts database containers concurrently, and without
    // pre-allocation the order in which containers finish determines which
    // suite gets which port — making assignments non-deterministic.
    const instancesWithPorts = instances.map((inst) => ({
      ...inst,
      port: allocatePort(),
    }));
    const environments = await Promise.all(
      instancesWithPorts.map((inst) => {
        const seedFn = SEED_FUNCTIONS[inst.envId];
        if (!seedFn) {
          throw new Error(`No seed function for environment "${inst.envId}"`);
        }
        return startEnvironment(inst.suiteId, inst.port, seedFn, assetServer.url);
      }),
    );

    const suites: Record<string, SuiteContext> = {};
    for (const env of environments) {
      suites[env.context.suiteId] = env.context;
      process.env[envUrlVar(env.context.suiteId)] = env.server.url;
    }
    await saveContext(suites);

    globalThis.__TEST_DBS__ = environments.map((e) => e.db);
    globalThis.__APP_SERVERS__ = environments.map((e) => e.server);

    log('setup', '=== E2E Global Setup Complete ===');
    log('setup', `Asset server URL: ${assetServer.url}`);
    for (const env of environments) {
      log('setup', `${env.context.suiteId} URL: ${env.server.url}`);
    }
  } catch (error) {
    logError('setup', 'Global setup failed', error);
    throw error;
  }
}
