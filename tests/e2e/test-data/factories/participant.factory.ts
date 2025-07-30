import { faker } from '@faker-js/faker';
import type { Participant } from '@prisma/client';
import { prisma } from '~/utils/db';

// Ensure consistent seeding for deterministic test data
// eslint-disable-next-line no-process-env
const PARTICIPANT_SEED = parseInt(process.env.FAKER_SEED ?? '12345');

type CreateParticipantOptions = {
  identifier?: string;
  label?: string;
};

/**
 * Create a test participant
 */
export const createTestParticipant = async (
  options: CreateParticipantOptions = {},
  seedOffset = 0,
): Promise<Participant> => {
  // Use seed offset for deterministic but varied data
  faker.seed(PARTICIPANT_SEED + seedOffset);
  
  const identifier =
    options.identifier ??
    `${faker.string.alphanumeric(8).toUpperCase()}-${Date.now()}`;
  const label = options.label ?? faker.person.fullName();

  return await prisma.participant.create({
    data: {
      identifier,
      label,
    },
  });
};

/**
 * Create multiple test participants
 */
export const createTestParticipants = async (
  count: number,
): Promise<Participant[]> => {
  const participants: Participant[] = [];

  for (let i = 0; i < count; i++) {
    const participant = await createTestParticipant({
      identifier: `PART${String(i + 1).padStart(3, '0')}`,
      // Don't pass label so it uses the seeded faker in createTestParticipant
    }, i); // Pass index as seed offset for varied but deterministic data
    participants.push(participant);
  }

  return participants;
};
