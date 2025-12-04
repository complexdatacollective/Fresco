import { exec } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { ADMIN_CREDENTIALS } from './config/test-config';
import { TestDataBuilder } from './fixtures/test-data-builder';
import { TestEnvironment } from './fixtures/test-environment';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

async function globalSetup() {
  // eslint-disable-next-line no-console
  console.log('🌍 Running global setup for e2e tests...\n');

  const testEnv = new TestEnvironment();

  // Build Docker image once if not provided
  await ensureDockerImage();

  // Setup parallel environments
  const setupPromises = [
    setupInitialSetupEnvironment(testEnv),
    // setupDashboardEnvironment(testEnv),
    // setupInterviewsEnvironment(testEnv),
  ];

  await Promise.all(setupPromises);

  // Store the test environment instance globally for teardown
  globalThis.__TEST_ENVIRONMENT__ = testEnv;

  // eslint-disable-next-line no-console
  console.log('\n✅ All test environments ready!\n');
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

async function ensureDockerImage() {
  // If TEST_IMAGE_NAME is already set (e.g., in CI), use that
  // eslint-disable-next-line no-process-env
  if (process.env.TEST_IMAGE_NAME) {
    // eslint-disable-next-line no-console
    console.log(
      // eslint-disable-next-line no-process-env
      `🐳 Using existing Docker image: ${process.env.TEST_IMAGE_NAME}`,
    );
    return;
  }

  // Build the image locally
  const projectRoot = path.join(__dirname, '../..');
  const dockerfile = path.join(projectRoot, 'Dockerfile');
  const imageName = 'fresco-test:latest';

  // eslint-disable-next-line no-console
  console.log(`🔨 Building Docker image: ${imageName}`);

  try {
    await execAsync(
      `docker build -t ${imageName} -f ${dockerfile} ${projectRoot}`,
    );

    // Set the environment variable for all test environments to use
    // Note: This is needed for runtime communication between setup and test files
    // eslint-disable-next-line no-process-env
    process.env.TEST_IMAGE_NAME = imageName;

    // eslint-disable-next-line no-console
    console.log(`✅ Docker image built successfully: ${imageName}\n`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to build Docker image:', error);
    throw error;
  }
}

export default globalSetup;
