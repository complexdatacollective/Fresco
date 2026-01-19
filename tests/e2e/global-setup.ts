import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { ADMIN_CREDENTIALS } from './config/test-config';
import {
  saveContextData,
  type SerializedContext,
} from './fixtures/context-storage';
import { NativeAppEnvironment } from './fixtures/native-app-environment';
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

  // Ensure standalone build exists
  await ensureStandaloneBuild();

  // Setup parallel environments
  const [setupContext, dashboardContext, interviewsContext] = await Promise.all(
    [
      setupInitialSetupEnvironment(testEnv),
      setupDashboardEnvironment(testEnv),
      setupInterviewsEnvironment(testEnv),
    ],
  );

  // Store the test environment instance globally for teardown
  globalThis.__TEST_ENVIRONMENT__ = testEnv;

  // Setup signal handlers for graceful cleanup
  setupSignalHandlers(testEnv);

  // Save serializable context data to file for test workers
  const contextData: Record<string, SerializedContext> = {};

  const serializeContext = (
    suiteId: string,
    ctx: TestEnvironmentContext,
  ): SerializedContext => ({
    suiteId,
    appUrl: ctx.appUrl,
    databaseUrl: ctx.dbContainer.getConnectionUri(),
  });

  contextData.setup = serializeContext('setup', setupContext);
  contextData.dashboard = serializeContext('dashboard', dashboardContext);
  contextData.interviews = serializeContext('interviews', interviewsContext);

  await saveContextData(contextData);

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

      await dataBuilder.createProtocol();

      // Create participants for database example tests
      for (let i = 1; i <= 10; i++) {
        await dataBuilder.createParticipant({
          identifier: `P${String(i).padStart(3, '0')}`,
          label: `Participant ${i}`,
        });
      }
    },
  });

  // Store dashboard context globally for easy access
  globalThis.__DASHBOARD_CONTEXT__ = context;

  return context;
}

async function setupInterviewsEnvironment(testEnv: TestEnvironment) {
  const context = await testEnv.create({
    suiteId: 'interviews',
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

      globalThis.__INTERVIEWS_TEST_DATA__ = {
        admin: adminData,
        protocol,
        participants,
      };
    },
  });

  // Disconnect Prisma before creating snapshot to avoid connection issues
  await context.prisma.$disconnect();

  // Create snapshot for restoration between interview tests
  await context.createSnapshot('initial');

  // Reconnect Prisma after snapshot
  await context.prisma.$connect();

  // Store context for use in tests
  globalThis.__INTERVIEWS_CONTEXT__ = context;

  return context;
}

async function ensureStandaloneBuild() {
  logger.build.checking();

  const nativeEnv = new NativeAppEnvironment();

  // Skip if valid build exists and FORCE_REBUILD != true
  // eslint-disable-next-line no-process-env
  const forceRebuild = process.env.FORCE_REBUILD === 'true';

  if (!forceRebuild && (await nativeEnv.isBuildValid())) {
    logger.build.valid();
    // Always clear the cache even when reusing the build
    await clearStandaloneCache();
    return;
  }

  logger.build.building();

  try {
    // Run: pnpm build with SKIP_ENV_VALIDATION=true
    await execFileAsync('pnpm', ['build'], {
      cwd: projectRoot,
      env: {
        // eslint-disable-next-line no-process-env
        ...process.env,
        SKIP_ENV_VALIDATION: 'true',
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

function setupSignalHandlers(testEnv: TestEnvironment) {
  const cleanup = async () => {
    logger.info('\nReceived interrupt signal, cleaning up...');
    await testEnv.cleanupAll();
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
