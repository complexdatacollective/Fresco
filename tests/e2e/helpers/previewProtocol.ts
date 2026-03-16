import { createId } from '@paralleldrive/cuid2';
import { hash } from 'ohash';
import { log } from './logger.js';
import { type TestPrismaClient } from './prisma.js';

export async function createPreviewProtocol(
  prisma: TestPrismaClient,
  options?: { isPending?: boolean; name?: string },
): Promise<string> {
  const protocolId = createId();
  const name = options?.name ?? `preview-test-${Date.now()}`;
  const nodeTypeId = createId();

  const stages = [
    {
      id: createId(),
      type: 'Information',
      label: 'Welcome',
      items: [
        {
          id: createId(),
          type: 'text',
          content: 'Welcome to the preview test interview.',
        },
      ],
    },
    {
      id: createId(),
      type: 'NameGeneratorQuickAdd',
      label: 'Add People',
      subject: { entity: 'node', type: nodeTypeId },
      quickAdd: 'name',
      prompts: [
        {
          id: createId(),
          text: 'Who are the people you interact with?',
        },
      ],
    },
  ];

  const codebook = {
    node: {
      [nodeTypeId]: {
        name: 'person',
        color: 'node-color-seq-1',
        variables: {
          name: { name: 'name', type: 'text' },
        },
      },
    },
    edge: {},
    ego: { variables: {} },
  };

  const protocol = {
    stages,
    codebook,
    schemaVersion: 8,
    lastModified: new Date().toISOString(),
    description: 'E2E test preview protocol',
  };

  const protocolHash = hash(protocol);

  await prisma.previewProtocol.create({
    data: {
      id: protocolId,
      hash: protocolHash,
      name,
      schemaVersion: 8,
      description: 'E2E test preview protocol',
      lastModified: new Date(),
      stages,
      codebook,
      isPending: options?.isPending ?? false,
    },
  });

  log('test', `Created preview protocol "${name}" (${protocolId})`);
  return protocolId;
}

/**
 * A minimal valid protocol for testing the preview API.
 * This is what a client (like Architect Web) would send.
 */
export function createTestProtocol(overrides?: {
  name?: string;
  description?: string;
}) {
  const nodeTypeId = createId();

  return {
    schemaVersion: 8,
    name: overrides?.name ?? 'E2E Test Protocol',
    description: overrides?.description ?? 'Protocol for E2E testing',
    lastModified: new Date().toISOString(),
    stages: [
      {
        id: createId(),
        type: 'Information',
        label: 'Welcome',
        items: [
          {
            id: createId(),
            type: 'text',
            content: 'Welcome to the test interview',
          },
        ],
      },
      {
        id: createId(),
        type: 'NameGeneratorQuickAdd',
        label: 'Add People',
        subject: { entity: 'node', type: nodeTypeId },
        quickAdd: 'name',
        prompts: [
          {
            id: createId(),
            text: 'Who do you interact with?',
          },
        ],
      },
    ],
    codebook: {
      ego: { variables: {} },
      node: {
        [nodeTypeId]: {
          name: 'person',
          color: 'node-color-seq-1',
          variables: {
            name: { name: 'name', type: 'text' },
          },
        },
      },
      edge: {},
    },
  };
}

/**
 * An invalid protocol (missing required fields) for testing validation.
 */
export const INVALID_PROTOCOL = {
  schemaVersion: 8,
  // Missing: stages, codebook
};

/**
 * Create test asset metadata for testing protocols with assets.
 */
export function createTestAssetMeta(count = 1) {
  return Array.from({ length: count }, (_, i) => ({
    assetId: createId(),
    name: `test-asset-${i}.png`,
    size: 1024 * (i + 1),
  }));
}
