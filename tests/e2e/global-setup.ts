import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { ADMIN_CREDENTIALS } from './config/test-config';
import {
  saveContextData,
  type InterviewTestData,
  type SerializedContext,
} from './fixtures/context-storage';
import { NativeAppEnvironment } from './fixtures/native-app-environment';
import { SnapshotServer } from './fixtures/snapshot-server';
import { TestDataBuilder } from './fixtures/test-data-builder';
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

  // Create initial snapshots for each environment
  // PostgreSQL's CREATE DATABASE WITH TEMPLATE requires no active connections.
  // We must stop Next.js and disconnect Prisma before creating snapshots.
  const nativeApp = testEnv.getNativeAppEnvironment();

  logger.info('Stopping Next.js servers for initial snapshot creation...');
  await Promise.all([
    nativeApp.stop('setup'),
    nativeApp.stop('dashboard'),
    // Interview context already handles this in setupInterviewsEnvironment
  ]);

  await Promise.all([
    setupContext.prisma.$disconnect(),
    dashboardContext.prisma.$disconnect(),
  ]);

  logger.info('Creating initial snapshots...');
  await Promise.all([
    setupContext.createSnapshot('initial'),
    dashboardContext.createSnapshot('initial'),
    // Interview context already creates 'initial' snapshot in setupInterviewsEnvironment
  ]);

  // Restart Next.js servers after snapshots are created
  logger.info('Restarting Next.js servers...');
  await Promise.all([
    nativeApp.start({
      suiteId: 'setup',
      port: setupContext.appContext.port,
      databaseUrl: setupContext.dbContainer.getConnectionUri(),
    }),
    nativeApp.start({
      suiteId: 'dashboard',
      port: dashboardContext.appContext.port,
      databaseUrl: dashboardContext.dbContainer.getConnectionUri(),
    }),
  ]);

  // Reconnect Prisma after snapshots are created
  await Promise.all([
    setupContext.prisma.$connect(),
    dashboardContext.prisma.$connect(),
  ]);

  // Create SQL-based 'initial' snapshots via the snapshot server
  // These are used by the test isolation mechanism (database.isolate())
  // and are separate from the container snapshots created above
  logger.info('Creating SQL-based initial snapshots for test isolation...');
  const snapshotResults = await Promise.all([
    fetch(`${snapshotServerUrl}/snapshot/setup/initial`, {
      method: 'POST',
    }).then((r) => r.json()),
    fetch(`${snapshotServerUrl}/snapshot/dashboard/initial`, {
      method: 'POST',
    }).then((r) => r.json()),
    fetch(`${snapshotServerUrl}/snapshot/interview/initial`, {
      method: 'POST',
    }).then((r) => r.json()),
  ]);

  // Verify all snapshots were created successfully
  for (const result of snapshotResults) {
    if (!result.success) {
      throw new Error(`Failed to create initial snapshot: ${result.error}`);
    }
    logger.info(
      `Created initial SQL snapshot for ${result.suiteId} (${result.size} bytes, ${result.tables} tables)`,
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
    setupData: async (prisma) => {
      const dataBuilder = new TestDataBuilder(prisma);

      // Set initializedAt to match production behavior (initialize.ts runs before server)
      // but keep configured=false so the setup flow is tested
      await dataBuilder.setupAppSettings({
        configured: false,
      });
    },
  });

  // Store setup context globally for easy access
  globalThis.__SETUP_CONTEXT__ = context;

  return context;
}

async function setupDashboardEnvironment(testEnv: TestEnvironment) {
  const context = await testEnv.create({
    suiteId: 'dashboard',
    setupData: async (prisma) => {
      const dataBuilder = new TestDataBuilder(prisma);

      // Setup app as configured
      await dataBuilder.setupAppSettings();

      // Create admin user with standardized credentials
      await dataBuilder.createUser(
        ADMIN_CREDENTIALS.username,
        ADMIN_CREDENTIALS.password,
      );

      const protocol = await dataBuilder.createProtocol();

      // Create participants for database example tests
      const participants = [];
      for (let i = 1; i <= 10; i++) {
        const participant = await dataBuilder.createParticipant({
          identifier: `P${String(i).padStart(3, '0')}`,
          label: `Participant ${i}`,
        });
        participants.push(participant);
      }

      // Create interviews for participants P001-P005
      // P001: Completed and exported
      await dataBuilder.createInterview(participants[0]!.id, protocol.id, {
        currentStep: 2,
        finishTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        exportTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      });

      // P002: Completed but not exported
      await dataBuilder.createInterview(participants[1]!.id, protocol.id, {
        currentStep: 2,
        finishTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      });

      // P003-P005: In progress at different stages
      await dataBuilder.createInterview(participants[2]!.id, protocol.id, {
        currentStep: 0,
      });
      await dataBuilder.createInterview(participants[3]!.id, protocol.id, {
        currentStep: 1,
      });
      await dataBuilder.createInterview(participants[4]!.id, protocol.id, {
        currentStep: 1,
      });

      // Create some activity events
      await dataBuilder.createEvent(
        'Protocol Imported',
        JSON.stringify({ name: 'Test Protocol' }),
      );
      await dataBuilder.createEvent(
        'Interview Started',
        JSON.stringify({ participant: 'P001' }),
      );
      await dataBuilder.createEvent(
        'Interview Completed',
        JSON.stringify({ participant: 'P001' }),
      );
    },
  });

  // Store dashboard context globally for easy access
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
      const dataBuilder = new TestDataBuilder(prisma);

      // Setup app settings
      await dataBuilder.setupAppSettings({
        configured: true,
        allowAnonymousRecruitment: true,
      });

      // Create admin user with standardized credentials
      const adminData = await dataBuilder.createUser(
        ADMIN_CREDENTIALS.username,
        ADMIN_CREDENTIALS.password,
      );

      // Create a protocol for interviews
      const protocol = await dataBuilder.createProtocol();

      // Create various participants with different states
      const participants = [];
      for (let i = 1; i <= 20; i++) {
        const participant = await dataBuilder.createParticipant({
          identifier: `P${String(i).padStart(3, '0')}`,
          label: `Participant ${i}`,
        });

        // Create interviews for some participants
        if (i <= 10) {
          await dataBuilder.createInterview(participant.id, protocol.id, {
            currentStep: i % 3,
            finishTime: i % 3 === 2 ? new Date() : null,
          });
        }

        participants.push(participant);
      }

      testData = {
        admin: adminData,
        protocol,
        participants,
      };
    },
  });

  if (!testData) {
    throw new Error('Test data was not initialized during setup');
  }

  // Stop Next.js and disconnect Prisma before creating snapshot
  // PostgreSQL's CREATE DATABASE WITH TEMPLATE requires no active connections
  const nativeApp = testEnv.getNativeAppEnvironment();
  await nativeApp.stop('interview');
  await context.prisma.$disconnect();

  // Create snapshot for restoration between interview tests
  await context.createSnapshot('initial');

  // Restart Next.js after snapshot
  await nativeApp.start({
    suiteId: 'interview',
    port: context.appContext.port,
    databaseUrl: context.dbContainer.getConnectionUri(),
  });

  // Reconnect Prisma after snapshot
  await context.prisma.$connect();

  // Store context for use in tests
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
