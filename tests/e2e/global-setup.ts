import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
  seedDashboardEnvironment,
  seedInterviewEnvironment,
  seedSetupEnvironment,
} from './fixtures/environment-configs';
import {
  saveContextData,
  type InterviewTestData,
  type SerializedContext,
} from './fixtures/context-storage';
import { NativeAppEnvironment } from './fixtures/native-app-environment';
import { createInitialSnapshot } from './fixtures/snapshot-client';
import { SnapshotServer } from './fixtures/snapshot-server';
import {
  TestEnvironment,
  type TestEnvironmentContext,
} from './fixtures/test-environment';
import { logger } from './utils/logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../..');
const execFileAsync = promisify(execFile);

async function globalSetup() {
  logger.setup.start();

  // Reset port allocation at the start of each test run
  NativeAppEnvironment.resetPortAllocation();

  const testEnv = new TestEnvironment();
  const snapshotServer = new SnapshotServer();

  // Give the snapshot server access to the NativeAppEnvironment for restarting apps
  snapshotServer.setNativeAppEnvironment(testEnv.getNativeAppEnvironment());

  // Start the snapshot server first so it's ready when environments are created
  const snapshotServerUrl = await snapshotServer.start();

  // Ensure standalone build exists
  await ensureStandaloneBuild();

  // Setup parallel environments
  const [setupContext, dashboardContext, interviewsResult] = await Promise.all([
    setupInitialSetupEnvironment(testEnv),
    setupDashboardEnvironment(testEnv),
    setupInterviewsEnvironment(testEnv),
  ]);

  // Register all suites with the snapshot server (container + Next.js port)
  snapshotServer.registerSuite(
    'setup',
    setupContext.dbContainer,
    setupContext.appContext.port,
  );
  snapshotServer.registerSuite(
    'dashboard',
    dashboardContext.dbContainer,
    dashboardContext.appContext.port,
  );
  snapshotServer.registerSuite(
    'interview',
    interviewsResult.context.dbContainer,
    interviewsResult.context.appContext.port,
  );

  // Create SQL-based 'initial' snapshots as JSON files
  // These are used by the test isolation mechanism (database.isolate())
  // and are stored in tests/e2e/.snapshots/<suiteId>/initial.json
  logger.info('Creating SQL-based initial snapshots for test isolation...');
  const snapshotResults = await Promise.all([
    createInitialSnapshot('setup', setupContext.dbContainer.getConnectionUri()),
    createInitialSnapshot(
      'dashboard',
      dashboardContext.dbContainer.getConnectionUri(),
    ),
    createInitialSnapshot(
      'interview',
      interviewsResult.context.dbContainer.getConnectionUri(),
    ),
  ]);

  // Log snapshot creation results
  const suiteIds = ['setup', 'dashboard', 'interview'];
  for (let i = 0; i < snapshotResults.length; i++) {
    const result = snapshotResults[i]!;
    const suiteId = suiteIds[i]!;
    if (!result.success) {
      throw new Error(`Failed to create initial snapshot for ${suiteId}`);
    }
    logger.info(
      `Created initial SQL snapshot for ${suiteId} (${result.size} bytes, ${result.tables} tables)`,
    );
  }

  // Store the test environment and snapshot server globally for teardown
  globalThis.__TEST_ENVIRONMENT__ = testEnv;
  globalThis.__SNAPSHOT_SERVER__ = snapshotServer;

  // Setup signal handlers for graceful cleanup
  setupSignalHandlers(testEnv, snapshotServer);

  // Save serializable context data to file for test workers
  const contextData: Record<string, SerializedContext> = {};

  const serializeContext = (
    suiteId: string,
    ctx: TestEnvironmentContext,
    testData?: InterviewTestData,
  ): SerializedContext => ({
    suiteId,
    appUrl: ctx.appUrl,
    databaseUrl: ctx.dbContainer.getConnectionUri(),
    testData,
  });

  contextData.setup = serializeContext('setup', setupContext);
  contextData.dashboard = serializeContext('dashboard', dashboardContext);
  contextData.interview = serializeContext(
    'interview',
    interviewsResult.context,
    interviewsResult.testData,
  );

  await saveContextData(contextData, snapshotServerUrl);

  logger.setup.complete();

  // If DEBUG_PAUSE is set, wait for user input before continuing
  // This allows you to inspect the database while containers are running
  // eslint-disable-next-line no-process-env
  if (process.env.DEBUG_PAUSE) {
    logger.setup.debugPause();
    await new Promise<void>((resolve) => {
      process.stdin.once('data', () => resolve());
    });
  }
}

async function setupInitialSetupEnvironment(testEnv: TestEnvironment) {
  const context = await testEnv.create({
    suiteId: 'setup',
    setupData: seedSetupEnvironment,
  });

  globalThis.__SETUP_CONTEXT__ = context;
  return context;
}

async function setupDashboardEnvironment(testEnv: TestEnvironment) {
  const context = await testEnv.create({
    suiteId: 'dashboard',
    setupData: seedDashboardEnvironment,
  });

  globalThis.__DASHBOARD_CONTEXT__ = context;
  return context;
}

async function setupInterviewsEnvironment(testEnv: TestEnvironment): Promise<{
  context: TestEnvironmentContext;
  testData: InterviewTestData;
}> {
  let testData: InterviewTestData | undefined;

  const context = await testEnv.create({
    suiteId: 'interview',
    setupData: async (prisma) => {
      testData = await seedInterviewEnvironment(prisma);
    },
  });

  if (!testData) {
    throw new Error('Test data was not initialized during setup');
  }

  globalThis.__INTERVIEW_CONTEXT__ = context;

  return { context, testData };
}

async function ensureStandaloneBuild() {
  logger.build.checking();

  const nativeEnv = new NativeAppEnvironment();

  // Always clear the cache even when reusing the build
  await clearStandaloneCache();

  // Skip if valid build exists and FORCE_REBUILD != true
  // eslint-disable-next-line no-process-env
  const forceRebuild = process.env.FORCE_REBUILD === 'true';

  if (!forceRebuild && (await nativeEnv.isBuildValid())) {
    logger.build.valid();

    return;
  }

  logger.build.building();

  try {
    // Run: pnpm build with test-specific env vars
    // DISABLE_NEXT_CACHE enables the no-op cache handler for test isolation
    await execFileAsync('pnpm', ['build'], {
      cwd: projectRoot,
      env: {
        // eslint-disable-next-line no-process-env
        ...process.env,
        SKIP_ENV_VALIDATION: 'true',
        DISABLE_NEXT_CACHE: 'true',
      },
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for build output
    });

    // Copy static assets to standalone directory
    logger.build.copyingAssets();

    const staticSrc = path.join(projectRoot, '.next/static');
    const staticDest = path.join(projectRoot, '.next/standalone/.next/static');
    const publicSrc = path.join(projectRoot, 'public');
    const publicDest = path.join(projectRoot, '.next/standalone/public');

    await fs.cp(staticSrc, staticDest, { recursive: true });
    await fs.cp(publicSrc, publicDest, { recursive: true });

    logger.build.assetsCopied();

    // Clear the cache after a fresh build
    await clearStandaloneCache();

    logger.build.success();
  } catch (error) {
    logger.build.error(error);
    throw error;
  }
}

/**
 * Clear the Next.js cache in the standalone build directory.
 * This prevents stale data from previous runs and avoids race conditions
 * when multiple test instances share the same cache directory.
 */
async function clearStandaloneCache() {
  const cacheDir = path.join(projectRoot, '.next/standalone/.next/cache');

  try {
    await fs.rm(cacheDir, { recursive: true, force: true });
    logger.build.cacheCleared();
  } catch {
    // Cache directory might not exist, which is fine
  }
}

function setupSignalHandlers(
  testEnv: TestEnvironment,
  snapshotServer: SnapshotServer,
) {
  const cleanup = async () => {
    logger.info('\nReceived interrupt signal, cleaning up...');
    await Promise.all([testEnv.cleanupAll(), snapshotServer.stop()]);
    process.exit(130);
  };

  process.on('SIGINT', () => {
    void cleanup();
  });

  process.on('SIGTERM', () => {
    void cleanup();
  });
}

export default globalSetup;
