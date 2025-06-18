import { faker } from '@faker-js/faker';
import type { Protocol } from '@prisma/client';
import { prisma } from '~/utils/db';

export type CreateProtocolOptions = {
  name?: string;
  description?: string;
  schemaVersion?: number;
};

/**
 * Generate a basic protocol structure for testing
 */
const generateBasicProtocol = (name: string, description?: string) => ({
  name,
  description: description ?? faker.lorem.sentence(),
  schemaVersion: 8,
  stages: [
    {
      id: 'stage1',
      type: 'NameGenerator',
      label: 'Name Generator Stage',
      prompts: [
        {
          id: 'prompt1',
          text: 'Please name people you know',
          variable: 'name',
        },
      ],
    },
    {
      id: 'stage2',
      type: 'Information',
      label: 'Information Stage',
      items: [
        {
          id: 'info1',
          content: 'Thank you for participating!',
        },
      ],
    },
  ],
  codebook: {
    node: {
      person: {
        name: 'Person',
        color: '#16a085',
        variables: {
          name: {
            name: 'Name',
            type: 'text',
          },
        },
      },
    },
    edge: {},
    ego: {
      variables: {},
    },
  },
});

/**
 * Create a test protocol
 */
export const createTestProtocol = async (
  options: CreateProtocolOptions = {},
): Promise<Protocol> => {
  const name = options.name ?? faker.company.name() + ' Study';
  const protocolData = generateBasicProtocol(name, options.description);

  const protocol = await prisma.protocol.create({
    data: {
      ...protocolData,
      hash: faker.string.uuid(),
      lastModified: new Date(),
      stages: protocolData.stages,
      codebook: protocolData.codebook,
      schemaVersion: options.schemaVersion || 6,
    },
  });

  return protocol;
};

/**
 * Create a protocol with complex stages for testing different interfaces
 */
export const createComplexTestProtocol = async (): Promise<Protocol> => {
  const protocolData = {
    name: 'Complex Test Protocol',
    description:
      'A protocol with multiple interface types for comprehensive testing',
    schemaVersion: 6,
    stages: [
      {
        id: 'name_generator',
        type: 'NameGenerator',
        label: 'Name Generator',
        prompts: [
          {
            id: 'friends_prompt',
            text: 'Please name people you consider friends',
            variable: 'name',
            nodeType: 'person',
          },
        ],
      },
      {
        id: 'sociogram',
        type: 'Sociogram',
        label: 'Sociogram',
        prompts: [
          {
            id: 'friendship_ties',
            text: 'Draw connections between people who are friends',
            edgeVariable: 'friendship',
          },
        ],
      },
      {
        id: 'ego_form',
        type: 'EgoForm',
        label: 'About You',
        form: {
          fields: [
            {
              variable: 'age',
              prompt: 'What is your age?',
              type: 'number',
            },
            {
              variable: 'gender',
              prompt: 'What is your gender?',
              type: 'categorical',
              options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
            },
          ],
        },
      },
    ],
    codebook: {
      node: {
        person: {
          name: 'Person',
          color: '#16a085',
          variables: {
            name: { name: 'Name', type: 'text' },
            age: { name: 'Age', type: 'number' },
            gender: { name: 'Gender', type: 'categorical' },
          },
        },
      },
      edge: {
        friendship: {
          name: 'Friendship',
          color: '#e74c3c',
          variables: {},
        },
      },
      ego: {
        variables: {
          age: { name: 'Age', type: 'number' },
          gender: { name: 'Gender', type: 'categorical' },
        },
      },
    },
  };

  return await prisma.protocol.create({
    data: {
      ...protocolData,
      hash: faker.string.uuid(),
      lastModified: new Date(),
      stages: protocolData.stages,
      codebook: protocolData.codebook,
    },
  });
};

/**
 * Create multiple test protocols
 */
export const createTestProtocols = async (
  count: number,
): Promise<Protocol[]> => {
  const protocols: Protocol[] = [];

  for (let i = 0; i < count; i++) {
    const protocol = await createTestProtocol({
      name: `Test Protocol ${i + 1}`,
      description: `Description for test protocol ${i + 1}`,
    });
    protocols.push(protocol);
  }

  return protocols;
};
