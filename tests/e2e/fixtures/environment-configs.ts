import type { PrismaClient } from '~/lib/db/generated/client';
import type { InterviewTestData } from './context-storage';
import { TestDataBuilder } from './test-data-builder';
import { ADMIN_CREDENTIALS } from '../config/test-config';

/**
 * Configuration for a test environment.
 * Each environment has a unique suiteId and a seed function that sets up test data.
 */
export type EnvironmentConfig = {
  suiteId: string;
  setupData: (prisma: PrismaClient) => Promise<InterviewTestData | void>;
};

/**
 * Seed function for the setup environment.
 * App is initialized but not configured - used for testing the onboarding flow.
 */
export async function seedSetupEnvironment(
  prisma: PrismaClient,
): Promise<void> {
  const builder = new TestDataBuilder(prisma);
  await builder.setupAppSettings({ configured: false });
}

/**
 * Seed function for the dashboard environment.
 * Fully configured app with admin user, protocol, participants, interviews, and events.
 */
export async function seedDashboardEnvironment(
  prisma: PrismaClient,
): Promise<void> {
  const builder = new TestDataBuilder(prisma);

  // Setup app as configured
  await builder.setupAppSettings();

  // Create admin user with standardized credentials
  await builder.createUser(
    ADMIN_CREDENTIALS.username,
    ADMIN_CREDENTIALS.password,
  );

  const protocol = await builder.createProtocol();

  // Create participants for database example tests
  const participants = [];
  for (let i = 1; i <= 10; i++) {
    const participant = await builder.createParticipant({
      identifier: `P${String(i).padStart(3, '0')}`,
      label: `Participant ${i}`,
    });
    participants.push(participant);
  }

  // Create interviews for participants P001-P005
  // P001: Completed and exported
  await builder.createInterview(participants[0]!.id, protocol.id, {
    currentStep: 2,
    finishTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    exportTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  });

  // P002: Completed but not exported
  await builder.createInterview(participants[1]!.id, protocol.id, {
    currentStep: 2,
    finishTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  });

  // P003-P005: In progress at different stages
  await builder.createInterview(participants[2]!.id, protocol.id, {
    currentStep: 0,
  });
  await builder.createInterview(participants[3]!.id, protocol.id, {
    currentStep: 1,
  });
  await builder.createInterview(participants[4]!.id, protocol.id, {
    currentStep: 1,
  });

  // Create some activity events
  await builder.createEvent(
    'Protocol Imported',
    JSON.stringify({ name: 'Test Protocol' }),
  );
  await builder.createEvent(
    'Interview Started',
    JSON.stringify({ participant: 'P001' }),
  );
  await builder.createEvent(
    'Interview Completed',
    JSON.stringify({ participant: 'P001' }),
  );
}

/**
 * Seed function for the interview environment.
 * Fully configured app with anonymous recruitment enabled.
 * Returns test data for use in interview tests.
 */
export async function seedInterviewEnvironment(
  prisma: PrismaClient,
): Promise<InterviewTestData> {
  const builder = new TestDataBuilder(prisma);

  // Setup app settings with anonymous recruitment enabled
  await builder.setupAppSettings({
    configured: true,
    allowAnonymousRecruitment: true,
  });

  // Create admin user with standardized credentials
  const admin = await builder.createUser(
    ADMIN_CREDENTIALS.username,
    ADMIN_CREDENTIALS.password,
  );

  // Create a protocol for interviews
  const protocol = await builder.createProtocol();

  // Create various participants with different states
  const participants = [];
  for (let i = 1; i <= 20; i++) {
    const participant = await builder.createParticipant({
      identifier: `P${String(i).padStart(3, '0')}`,
      label: `Participant ${i}`,
    });

    // Create interviews for some participants
    if (i <= 10) {
      await builder.createInterview(participant.id, protocol.id, {
        currentStep: i % 3,
        finishTime: i % 3 === 2 ? new Date() : null,
      });
    }

    participants.push(participant);
  }

  return {
    admin,
    protocol,
    participants,
  };
}

/**
 * Environment configurations for all test suites.
 * Used by global-setup.ts to create test environments.
 */
export const ENVIRONMENT_CONFIGS: EnvironmentConfig[] = [
  { suiteId: 'setup', setupData: seedSetupEnvironment },
  { suiteId: 'dashboard', setupData: seedDashboardEnvironment },
  { suiteId: 'interview', setupData: seedInterviewEnvironment },
];
