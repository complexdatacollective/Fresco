import { faker } from '@faker-js/faker';
import type { Interview, Participant } from '@prisma/client';
import { prisma } from '~/utils/db';
import { type Protocol } from './protocol.factory';

export type CreateInterviewOptions = {
  protocolId?: string;
  participantId?: string;
  currentStep?: number;
  isFinished?: boolean;
  withNetwork?: boolean;
};

/**
 * Generate a basic network for an interview
 */
const generateBasicNetwork = () => ({
  nodes: [
    {
      uid: faker.string.uuid(),
      type: 'person',
      attributes: {
        name: faker.person.firstName(),
      },
    },
    {
      uid: faker.string.uuid(),
      type: 'person',
      attributes: {
        name: faker.person.firstName(),
      },
    },
  ],
  edges: [],
  ego: {
    uid: 'ego',
    attributes: {},
  },
});

/**
 * Create a test interview
 */
export const createTestInterview = async (
  options: CreateInterviewOptions = {},
): Promise<Interview> => {
  let protocolId = options.protocolId;
  let participantId = options.participantId;

  // Create protocol if not provided
  if (!protocolId) {
    const { createTestProtocol } = await import('./protocol.factory');
    const protocol = await createTestProtocol();
    protocolId = protocol.id;
  }

  // Create participant if not provided
  if (!participantId) {
    const { createTestParticipant } = await import('./participant.factory');
    const participant = await createTestParticipant();
    participantId = participant.id;
  }

  const network = options.withNetwork
    ? generateBasicNetwork()
    : { nodes: [], edges: [], ego: { uid: 'ego', attributes: {} } };

  return await prisma.interview.create({
    data: {
      protocolId,
      participantId,
      currentStep: options.currentStep ?? 0,
      network,
      finishTime: options.isFinished ? new Date() : null,
      stageMetadata: {},
    },
  });
};

/**
 * Create multiple test interviews
 */
export const createTestInterviews = async (
  count: number,
  protocol: Protocol,
  participants?: Participant[],
): Promise<Interview[]> => {
  const interviews: Interview[] = [];

  // Create participants if not provided
  if (!participants) {
    const { createTestParticipants } = await import('./participant.factory');
    participants = await createTestParticipants(count);
  }

  for (let i = 0; i < count; i++) {
    const interview = await createTestInterview({
      protocolId: protocol.id,
      participantId: participants[i]?.id,
      currentStep: faker.number.int({ min: 0, max: 3 }),
      isFinished: faker.datatype.boolean(),
      withNetwork: true,
    });
    interviews.push(interview);
  }

  return interviews;
};
