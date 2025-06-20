import { generateMock } from '@anatine/zod-mock';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  NcEdgeSchema,
  NcNetworkSchema,
  type NcEdge,
  type NcEgo,
  type NcNetwork,
  type NcNode,
} from '@codaco/shared-consts';
import { faker } from '@faker-js/faker';
import type { Interview, Participant } from '@prisma/client';
import { prisma } from '~/utils/db';
import { type Protocol } from './protocol.factory';

type CreateInterviewOptions = {
  protocolId?: string;
  participantId?: string;
  currentStep?: number;
  isFinished?: boolean;
  withNetwork?: boolean;
  networkSize?: 'small' | 'medium' | 'large';
};

/**
 * Generate a network using the proper NcEntity and NcEdge schemas
 */
const generateNetwork = (
  size: 'small' | 'medium' | 'large' = 'small',
): NcNetwork => {
  const nodeCount = size === 'small' ? 2 : size === 'medium' ? 5 : 10;
  const edgeCount = Math.min(
    Math.floor(nodeCount / 2),
    size === 'large' ? 8 : 3,
  );

  // Generate nodes using NcEntity schema (which is actually NcNode for nodes)
  const nodes: NcNode[] = Array.from({ length: nodeCount }, () => {
    const node = generateMock(NcNetworkSchema.shape.nodes.element, {
      stringMap: {
        [entityPrimaryKeyProperty]: () => faker.string.uuid(),
        type: () =>
          faker.helpers.arrayElement(['person', 'organization', 'place']),
        stageId: () => faker.string.uuid(),
      },
    });

    // Override attributes with realistic data
    node[entityAttributesProperty] = {
      name: faker.person.fullName(),
      age: faker.number.int({ min: 18, max: 80 }),
      gender: faker.helpers.arrayElement(['male', 'female', 'other']),
      layout: {
        // Add positioning for sociogram visualizations
        x: faker.number.float({ min: 0, max: 800 }),
        y: faker.number.float({ min: 0, max: 600 }),
      },
    };

    return node;
  });

  // Generate edges using NcEdge schema
  const edges: NcEdge[] = [];
  if (nodes.length > 1) {
    for (let i = 0; i < edgeCount; i++) {
      const fromNode = faker.helpers.arrayElement(nodes);
      const toNode = faker.helpers.arrayElement(
        nodes.filter(
          (n) =>
            n[entityPrimaryKeyProperty] !== fromNode[entityPrimaryKeyProperty],
        ),
      );

      if (toNode) {
        const edge = generateMock(NcEdgeSchema, {
          stringMap: {
            [entityPrimaryKeyProperty]: () => faker.string.uuid(),
            type: () =>
              faker.helpers.arrayElement(['friendship', 'colleague', 'family']),
            from: () => fromNode[entityPrimaryKeyProperty],
            to: () => toNode[entityPrimaryKeyProperty],
          },
        });

        // Override attributes with realistic data
        edge[entityAttributesProperty] = {
          strength: faker.number.int({ min: 1, max: 10 }),
          duration: faker.number.int({ min: 1, max: 20 }),
        };

        edges.push(edge);
      }
    }
  }

  // Generate ego using NcEgo schema (which is BaseNcEntitySchema)
  const ego: NcEgo = generateMock(NcNetworkSchema.shape.ego, {
    stringMap: {
      [entityPrimaryKeyProperty]: () => 'ego',
    },
  });

  // Override ego attributes with realistic data
  ego[entityAttributesProperty] = {
    name: faker.person.fullName(),
    age: faker.number.int({ min: 18, max: 80 }),
  };

  return {
    nodes,
    edges,
    ego,
  };
};

/**
 * Generate an empty network
 */
const generateEmptyNetwork = (): NcNetwork => {
  const ego = generateMock(NcNetworkSchema.shape.ego, {
    stringMap: {
      [entityPrimaryKeyProperty]: () => 'ego',
    },
  });

  ego[entityAttributesProperty] = {};

  return {
    nodes: [],
    edges: [],
    ego,
  };
};

/**
 * Create a test interview
 */
const createTestInterview = async (
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
    ? generateNetwork(options.networkSize ?? 'small')
    : generateEmptyNetwork();

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
