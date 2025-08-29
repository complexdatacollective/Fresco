import { createId } from '@paralleldrive/cuid2';
import { type PrismaClient } from '@prisma/client';
import { getStringValue } from '~/utils/getStringValue';

export class TestDataBuilder {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a test user with authentication
   */
  async createUser(overrides: { username?: string; password?: string } = {}) {
    const username = overrides.username ?? `testuser_${createId().slice(0, 8)}`;
    const password = overrides.password ?? 'TestPassword123!';

    // Create user
    const user = await this.prisma.user.create({
      data: {
        id: createId(),
        username,
      },
    });

    // Create authentication key (simplified for testing)
    // In production, this would use proper hashing with Lucia
    await this.prisma.key.create({
      data: {
        id: `username:${username}`,
        user_id: user.id,
        hashed_password: `hashed_${password}`, // Simplified for testing
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
        network: overrides.network || { nodes: [], edges: [], ego: {} },
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
    };

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
   * Setup a complete test environment with protocol, participants, and interviews
   */
  async setupCompleteTestData() {
    // Setup app settings
    await this.setupAppSettings();

    // Create admin user
    const adminData = await this.createUser({
      username: `admin_${createId().slice(0, 8)}`,
      password: 'AdminPassword123!',
    });

    // Create a protocol
    const protocol = await this.createProtocol({
      name: 'Test Study Protocol',
      description: 'A comprehensive protocol for testing',
    });

    // Create participants
    const participants = await Promise.all([
      this.createParticipant({ identifier: 'P001', label: 'Alice' }),
      this.createParticipant({ identifier: 'P002', label: 'Bob' }),
      this.createParticipant({ identifier: 'P003', label: 'Charlie' }),
    ]);

    // Create interviews
    const interviews = await Promise.all([
      // Completed interview
      this.createInterview(participants[0].id, protocol.id, {
        currentStep: 2,
        finishTime: new Date(),
        network: {
          nodes: [
            { id: '1', type: 'person', attributes: { name: 'John' } },
            { id: '2', type: 'person', attributes: { name: 'Jane' } },
          ],
          edges: [{ from: '1', to: '2', type: 'knows' }],
          ego: { name: 'Alice' },
        },
      }),
      // In-progress interview
      this.createInterview(participants[1].id, protocol.id, {
        currentStep: 1,
        network: {
          nodes: [{ id: '1', type: 'person', attributes: { name: 'Mike' } }],
          edges: [],
          ego: { name: 'Bob' },
        },
      }),
      // Not started interview
      this.createInterview(participants[2].id, protocol.id),
    ]);

    return {
      admin: adminData,
      protocol,
      participants,
      interviews,
    };
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
