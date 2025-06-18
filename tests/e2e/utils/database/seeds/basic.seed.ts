import {
  createTestInterviews,
  createTestParticipants,
  createTestProtocol,
  createTestUser,
} from '~/tests/e2e/test-data/factories';
import { resetDatabaseToInitialState } from '~/tests/e2e/utils/database/cleanup';

export type BasicSeedData = {
  user: { id: string; username: string; password: string };
  protocols: any[];
  participants: any[];
  interviews: any[];
};

/**
 * Seed database with basic test data
 */
export const seedBasicData = async (): Promise<BasicSeedData> => {
  console.log('Seeding basic test data...');
  // Reset database to clean state
  await resetDatabaseToInitialState();

  // Create test user
  const user = await createTestUser({
    username: 'testuser',
    password: 'testPassword123!',
  });

  // Create test protocols
  const protocol1 = await createTestProtocol({
    name: 'Test Protocol 1',
    description: 'A basic protocol for testing',
  });

  const protocol2 = await createTestProtocol({
    name: 'Test Protocol 2',
    description: 'Another protocol for testing',
  });

  // Create test participants
  const participants = await createTestParticipants(5);

  // Create some interviews
  const interviews1 = await createTestInterviews(
    3,
    protocol1,
    participants.slice(0, 3),
  );
  const interviews2 = await createTestInterviews(
    2,
    protocol2,
    participants.slice(3, 5),
  );

  return {
    user,
    protocols: [protocol1, protocol2],
    participants,
    interviews: [...interviews1, ...interviews2],
  };
};
