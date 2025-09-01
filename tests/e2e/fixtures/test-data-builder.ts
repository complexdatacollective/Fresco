import { createId } from '@paralleldrive/cuid2';
import { type PrismaClient } from '@prisma/client';
import { generateLuciaPasswordHash } from 'lucia/utils';
import { type z } from 'zod';
import { type appSettingsSchema } from '~/schemas/appSettings';
import { getStringValue } from '~/utils/getStringValue';

export class TestDataBuilder {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a test user with authentication
   */
  async createUser(username: string, password: string) {
    // Create user
    const user = await this.prisma.user.create({
      data: {
        id: createId(),
        username,
      },
    });

    await this.prisma.key.create({
      data: {
        id: `username:${username}`,
        user_id: user.id,
        hashed_password: await generateLuciaPasswordHash(password),
      },
    });

    return {
      user,
      username,
      password,
    };
  }

  /**
   * Create a test protocol with basic data
   */
  async createProtocol(
    overrides: {
      name?: string;
      description?: string;
      stages?: unknown;
      codebook?: unknown;
    } = {},
  ) {
    const protocol = await this.prisma.protocol.create({
      data: {
        id: createId(),
        hash: `hash_${createId()}`,
        name: overrides.name ?? `Test Protocol ${Date.now()}`,
        description: overrides.description ?? 'A test protocol for e2e testing',
        schemaVersion: 8,
        lastModified: new Date(),
        stages: overrides.stages ?? {
          stages: [
            {
              id: 'stage1',
              label: 'Information',
              type: 'Information',
              panels: [
                {
                  id: 'panel1',
                  title: 'Welcome',
                  text: 'Welcome to the test protocol',
                },
              ],
            },
            {
              id: 'stage2',
              label: 'Name Generator',
              type: 'NameGenerator',
              subject: {
                entity: 'node',
                type: 'person',
              },
              prompts: [
                {
                  id: 'prompt1',
                  text: 'Name some people you know',
                },
              ],
            },
          ],
        },
        codebook: overrides.codebook ?? {
          node: {
            person: {
              name: 'Person',
              color: 'blue',
              iconVariant: 'user',
              variables: {
                name: {
                  type: 'string',
                  name: 'Name',
                  required: true,
                },
              },
            },
          },
          edge: {},
          ego: {},
        },
      },
    });

    return protocol;
  }

  /**
   * Create a participant
   */
  async createParticipant(
    overrides: {
      identifier?: string;
      label?: string;
    } = {},
  ) {
    const participant = await this.prisma.participant.create({
      data: {
        id: createId(),
        identifier: overrides.identifier ?? `P${Date.now()}`,
        label: overrides.label ?? `Participant ${createId().slice(0, 8)}`,
      },
    });

    return participant;
  }

  /**
   * Create an interview
   */
  async createInterview(
    participantId: string,
    protocolId: string,
    overrides: {
      currentStep?: number;
      network?: unknown;
      finishTime?: Date | null;
    } = {},
  ) {
    const interview = await this.prisma.interview.create({
      data: {
        id: createId(),
        participantId,
        protocolId,
        currentStep: overrides.currentStep ?? 0,
        network: overrides.network ?? { nodes: [], edges: [], ego: {} },
        finishTime: overrides.finishTime ?? null,
      },
    });

    return interview;
  }

  /**
   * Create app settings for testing
   */
  async setupAppSettings(
    settings: {
      configured?: boolean;
      allowAnonymousRecruitment?: boolean;
      limitInterviews?: boolean;
      disableAnalytics?: boolean;
    } = {},
  ) {
    const defaultSettings = {
      configured: true,
      allowAnonymousRecruitment: true,
      limitInterviews: false,
      disableAnalytics: true,
      initializedAt: new Date(),
      installationId: `test-${createId()}`,
      uploadThingToken: "UPLOADTHING_TOKEN='TEST_TOKEN'",
    } as z.infer<typeof appSettingsSchema>;

    const finalSettings = { ...defaultSettings, ...settings };

    // Create or update settings
    for (const [key, value] of Object.entries(finalSettings)) {
      await this.prisma.appSettings.upsert({
        where: { key: key as keyof typeof defaultSettings },
        update: { value: getStringValue(value) },
        create: {
          key: key as keyof typeof defaultSettings,
          value: getStringValue(value),
        },
      });
    }

    return finalSettings;
  }

  /**
   * Create multiple protocols for testing protocol management
   */
  async createMultipleProtocols(count = 5) {
    const protocols = [];
    for (let i = 0; i < count; i++) {
      const protocol = await this.createProtocol({
        name: `Protocol ${i + 1}`,
        description: `Description for protocol ${i + 1}`,
      });
      protocols.push(protocol);
    }
    return protocols;
  }

  /**
   * Create a protocol with assets
   */
  async createProtocolWithAssets() {
    const protocol = await this.createProtocol({
      name: 'Protocol with Assets',
    });

    // Create some test assets
    const assets = await Promise.all([
      this.prisma.asset.create({
        data: {
          key: `asset_${createId()}`,
          assetId: createId(),
          name: 'test-image.jpg',
          type: 'image/jpeg',
          url: '/assets/test-image.jpg',
          size: 1024,
          protocols: {
            connect: { id: protocol.id },
          },
        },
      }),
      this.prisma.asset.create({
        data: {
          key: `asset_${createId()}`,
          assetId: createId(),
          name: 'test-video.mp4',
          type: 'video/mp4',
          url: '/assets/test-video.mp4',
          size: 5242880,
          protocols: {
            connect: { id: protocol.id },
          },
        },
      }),
    ]);

    return { protocol, assets };
  }
}
