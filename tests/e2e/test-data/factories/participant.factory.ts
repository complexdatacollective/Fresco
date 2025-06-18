import { faker } from '@faker-js/faker';
import type { Participant } from '@prisma/client';
import { prisma } from '~/utils/db';

export type CreateParticipantOptions = {
  identifier?: string;
  label?: string;
};

/**
 * Create a test participant
 */
export const createTestParticipant = async (
  options: CreateParticipantOptions = {},
): Promise<Participant> => {
  const identifier =
    options.identifier ||
    `${faker.string.alphanumeric(8).toUpperCase()}-${Date.now()}`;
  const label = options.label || faker.person.fullName();

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
      label: faker.person.fullName(),
    });
    participants.push(participant);
  }

  return participants;
};
