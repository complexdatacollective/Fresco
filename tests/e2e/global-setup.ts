import { exec } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
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
    setupProtocolsEnvironment(testEnv),
    // setupInterviewsEnvironment(testEnv),
    // setupParticipantsEnvironment(testEnv),
  ];

  const results = await Promise.all(setupPromises);

  // Store URLs in environment variables for Playwright projects
  process.env.SETUP_URL = results[0]?.appUrl ?? '';
  process.env.PROTOCOLS_URL = results[1]?.appUrl ?? '';
  process.env.INTERVIEWS_URL = results[2]?.appUrl ?? '';
  process.env.PARTICIPANTS_URL = results[3]?.appUrl ?? '';

  // Store the test environment instance globally for teardown
  global.__TEST_ENVIRONMENT__ = testEnv;

  // eslint-disable-next-line no-console
  console.log('\n✅ All test environments ready!\n');
  // eslint-disable-next-line no-console
  console.log(`  Setup:        ${process.env.SETUP_URL ?? 'N/A'}`);
  // eslint-disable-next-line no-console
  console.log(`  Protocols:    ${process.env.PROTOCOLS_URL ?? 'N/A'}`);
  // eslint-disable-next-line no-console
  console.log(`  Interviews:   ${process.env.INTERVIEWS_URL ?? 'N/A'}`);
  // eslint-disable-next-line no-console
  console.log(`  Participants: ${process.env.PARTICIPANTS_URL ?? 'N/A'}\n`);
}

async function setupInitialSetupEnvironment(testEnv: TestEnvironment) {
  const context = await testEnv.create({
    suiteId: 'setup',
  });

  return context;
}

async function setupProtocolsEnvironment(testEnv: TestEnvironment) {
  const context = await testEnv.create({
    suiteId: 'protocols',
    setupData: async (prisma) => {
      const dataBuilder = new TestDataBuilder(prisma);

      // Setup app as configured
      await dataBuilder.setupAppSettings();

      // Create admin user
      await dataBuilder.createUser({
        username: 'admin',
        password: 'AdminPass123!',
      });

      // Create multiple protocols for testing
      await dataBuilder.createMultipleProtocols(10);

      // Create a protocol with assets
      await dataBuilder.createProtocolWithAssets();
    },
  });

  return context;
}

async function setupInterviewsEnvironment(testEnv: TestEnvironment) {
  const context = await testEnv.create({
    suiteId: 'interviews',
    setupData: async (prisma) => {
      const dataBuilder = new TestDataBuilder(prisma);

      // Setup complete test data
      const testData = await dataBuilder.setupCompleteTestData();

      // Store test data for use in tests
      global.__INTERVIEWS_TEST_DATA__ = testData;
    },
  });

  // Create snapshot for restoration between interview tests
  await context.createSnapshot('initial');

  // Store context for use in tests
  global.__INTERVIEWS_CONTEXT__ = context;

  return context;
}

async function setupParticipantsEnvironment(testEnv: TestEnvironment) {
  const context = await testEnv.create({
    suiteId: 'participants',
    setupData: async (prisma) => {
      const dataBuilder = new TestDataBuilder(prisma);

      // Setup app settings
      await dataBuilder.setupAppSettings({
        allowAnonymousRecruitment: true,
      });

      // Create admin user
      await dataBuilder.createUser({
        username: 'admin_participants',
        password: 'AdminPass123!',
      });

      // Create a protocol for interviews
      const protocol = await dataBuilder.createProtocol({
        name: 'Main Study Protocol',
      });

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

      global.__PARTICIPANTS_TEST_DATA__ = {
        protocol,
        participants,
      };
    },
  });

  return context;
}

async function ensureDockerImage() {
  // If TEST_IMAGE_NAME is already set (e.g., in CI), use that
  if (process.env.TEST_IMAGE_NAME) {
    // eslint-disable-next-line no-console
    console.log(
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
