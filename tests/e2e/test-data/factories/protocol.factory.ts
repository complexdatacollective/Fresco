import type { Protocol as NcProtocol } from '@codaco/protocol-validation';
import { faker } from '@faker-js/faker';
import { prisma } from '~/utils/db';

export type CreateProtocolOptions = {
  name?: string;
  description?: string;
  schemaVersion?: number;
};

// We use this rather than the type from the prisma client because this includes
// our custom transformations in ~/utils/db
export type Protocol = NonNullable<
  Awaited<ReturnType<typeof prisma.protocol.findFirst>>
>;

/**
 * Generate a basic protocol structure for testing
 */
const generateBasicProtocol = (description?: string): NcProtocol => ({
  description: description ?? faker.lorem.sentence(),
  schemaVersion: 8,
  stages: [
    {
      id: 'stage1',
      type: 'NameGeneratorQuickAdd',
      subject: {
        entity: 'node',
        type: 'node',
      },
      quickAdd: 'name',
      label: 'Name Generator Stage',
      prompts: [
        {
          id: 'prompt1',
          text: 'Please name people you know',
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
          type: 'text',
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
  const protocolData = generateBasicProtocol(options.description);

  const protocol = await prisma.protocol.create({
    data: {
      name,
      description: protocolData.description,
      hash: faker.string.uuid(),
      lastModified: new Date(),
      stages: protocolData.stages,
      codebook: protocolData.codebook,
      schemaVersion: options.schemaVersion ?? 8,
    },
  });

  return protocol;
};

/**
 * Create a protocol with complex stages for testing different interfaces
 */
export const createComplexTestProtocol = async (): Promise<Protocol> => {
  const protocolData: NcProtocol = {
    description:
      'A protocol with multiple interface types for comprehensive testing',
    schemaVersion: 8,
    stages: [
      {
        id: 'name_generator',
        type: 'NameGeneratorQuickAdd',
        quickAdd: 'name',
        subject: {
          entity: 'node',
          type: 'person',
        },
        label: 'Name Generator',
        prompts: [
          {
            id: 'friends_prompt',
            text: 'Please name people you consider friends',
          },
        ],
      },
      {
        id: 'sociogram',
        type: 'Sociogram',
        label: 'Sociogram',
        subject: {
          entity: 'node',
          type: 'person',
        },
        prompts: [
          {
            id: 'friendship_ties',
            text: 'Draw connections between people who are friends',
            edges: {
              display: ['friendship'],
              create: 'friendship',
            },
            layout: {
              layoutVariable: 'layout',
            },
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
            },
            {
              variable: 'gender',
              prompt: 'What is your gender?',
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
            gender: {
              name: 'Gender',
              type: 'categorical',
              options: [
                {
                  label: 'Male',
                  value: 'male',
                },
                {
                  label: 'Female',
                  value: 'female',
                },
                {
                  label: 'Non-binary',
                  value: 'non-binary',
                },
                {
                  label: 'Prefer not to say',
                  value: 'prefer-not-to-say',
                },
              ],
            },
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
          gender: {
            name: 'Gender',
            type: 'categorical',
            options: [
              {
                label: 'Male',
                value: 'male',
              },
              {
                label: 'Female',
                value: 'female',
              },
              {
                label: 'Non-binary',
                value: 'non-binary',
              },
              {
                label: 'Prefer not to say',
                value: 'prefer-not-to-say',
              },
            ],
          },
        },
      },
    },
  };

  return await prisma.protocol.create({
    data: {
      name: faker.company.name() + ' Complex Protocol',
      description: protocolData.description,
      hash: faker.string.uuid(),
      lastModified: new Date(),
      stages: protocolData.stages,
      codebook: protocolData.codebook,
      schemaVersion: protocolData.schemaVersion,
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
