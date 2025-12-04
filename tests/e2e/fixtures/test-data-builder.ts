import {
  type CurrentProtocol,
  CurrentProtocolSchema,
} from '@codaco/protocol-validation';
import { createId } from '@paralleldrive/cuid2';
import { type PrismaClient } from '@prisma/client';
import { generateLuciaPasswordHash } from 'lucia/utils';
import { hash as objectHash } from 'ohash';
import { type z } from 'zod';
import { type appSettingPreprocessedSchema } from '~/schemas/appSettings';
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
  async createProtocol() {
    const testProtocol: CurrentProtocol = {
      description: 'A test protocol for e2e testing',
      schemaVersion: 8,
      stages: [
        {
          id: 'stage1',
          label: 'Information',
          type: 'Information',
          items: [
            {
              id: 'item1',
              type: 'text',
              content: 'What is your name?',
            },
            {
              id: 'item2',
              type: 'text',
              content: 'What is your age?',
            },
          ],
        },
        {
          id: 'stage2',
          label: 'Name Generator',
          type: 'NameGeneratorQuickAdd',
          quickAdd: 'name',
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
      codebook: {
        node: {
          person: {
            name: 'Person',
            color: 'node-color-seq-3',
            iconVariant: 'user',
            variables: {
              name: {
                type: 'text',
                name: 'Name',
              },
            },
          },
        },
        edge: {},
        ego: {},
      },
    };

    const safeProtocol = CurrentProtocolSchema.parse(testProtocol);

    const protocol = await this.prisma.protocol.create({
      data: {
        name: `Test Protocol`,
        hash: objectHash(safeProtocol),
        lastModified: new Date(),
        ...safeProtocol,
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
    } as z.infer<typeof appSettingPreprocessedSchema>;

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
}
