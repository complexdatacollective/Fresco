import { type Interview, type Participant } from '@prisma/client';
import {
  createComplexTestProtocol,
  createTestInterviews,
  createTestParticipants,
  createTestProtocols,
  createTestUser,
  type Protocol,
  type TestUser,
} from '~/tests/e2e/test-data/factories';
import { cleanDatabase } from '~/tests/e2e/utils/database/cleanup';
import { prisma } from '~/utils/db';

export type DashboardSeedData = {
  user: TestUser;
  protocols: Protocol[];
  participants: Participant[];
  interviews: Interview[];
};

/**
 * Seed database with comprehensive data for dashboard testing
 */
export const seedDashboardData = async () => {
  await cleanDatabase();

  // Create admin user
  const adminUser = await createTestUser({
    username: 'admin',
    password: 'adminPassword123!',
  });

  // Create multiple protocols for testing pagination and filtering
  const protocols = await createTestProtocols(10);

  // Add one complex protocol
  const complexProtocol = await createComplexTestProtocol();
  protocols.push(complexProtocol);

  // Create many participants for testing large datasets
  const participants = await createTestParticipants(50);

  // Create interviews with various states
  const allInterviews = [];

  for (const protocol of protocols) {
    const protocolParticipants = participants.slice(0, 5); // 5 interviews per protocol
    const interviews = await createTestInterviews(
      5,
      protocol,
      protocolParticipants,
    );
    allInterviews.push(...interviews);
  }

  // Create some finished interviews
  for (let i = 0; i < 10; i++) {
    const finishedInterview = allInterviews[i];
    if (finishedInterview) {
      await prisma.interview.update({
        where: { id: finishedInterview.id },
        data: { finishTime: new Date() },
      });
    }
  }

  return {
    user: adminUser,
    protocols,
    participants,
    interviews: allInterviews,
  };
};
