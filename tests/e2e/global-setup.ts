/* eslint-disable no-process-env */
import path from 'node:path';
import { AppServer } from './helpers/appServer.js';
import { AssetServer, ASSET_SERVER_PORT } from './helpers/assetServer.js';
import { log, logError } from './helpers/logger.js';
import { seedAppSettings } from './helpers/seedAppSettings.js';
import { TestDatabase } from './helpers/testDatabase.js';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');
const E2E_ASSETS_DIR = path.join(PROJECT_ROOT, '.e2e-assets');

declare global {
  // eslint-disable-next-line no-var
  var __E2E__:
    | { db: TestDatabase; app: AppServer; asset: AssetServer }
    | undefined;
}

export default async function globalSetup() {
  log('setup', '=== E2E Global Setup Starting ===');

  try {
    const db = await TestDatabase.start();
    db.runMigrations();
    await seedAppSettings(db.connectionUri);

    const asset = await AssetServer.start(E2E_ASSETS_DIR, ASSET_SERVER_PORT);
    const app = await AppServer.start(db.connectionUri);

    process.env.E2E_DATABASE_URL = db.connectionUri;
    process.env.E2E_APP_URL = app.url;
    process.env.E2E_ASSET_URL = asset.url;

    globalThis.__E2E__ = { db, app, asset };

    log('setup', '=== E2E Global Setup Complete ===');
    log('setup', `Database: ${db.connectionUri}`);
    log('setup', `App:      ${app.url}`);
    log('setup', `Assets:   ${asset.url}`);
  } catch (error) {
    logError('setup', 'Global setup failed', error);
    throw error;
  }
}
