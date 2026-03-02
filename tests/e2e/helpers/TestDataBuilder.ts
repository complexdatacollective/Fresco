import { createId } from '@paralleldrive/cuid2';
import { hash } from 'ohash';
import { type AppSetting, type Prisma } from '~/lib/db/generated/client.js';
import { log } from './logger.js';
import { createTestPrisma, type TestPrismaClient } from './prisma.js';

/**
 * Utility for generating sequential timestamps with guaranteed ordering.
 * Useful for seeding events that need deterministic ordering by timestamp.
 */
export class TimestampGenerator {
  private current: Date;
  private incrementMs: number;

  constructor(startTime = new Date(), incrementMs = 1000) {
    this.current = new Date(startTime.getTime());
    this.incrementMs = incrementMs;
  }

  next(): Date {
    const timestamp = new Date(this.current.getTime());
    this.current = new Date(this.current.getTime() + this.incrementMs);
    return timestamp;
  }
}

// Pre-computed scrypt hash for 'TestAdmin123!' using lucia/utils generateLuciaPasswordHash().
// This avoids importing lucia/utils at runtime which pulls in the full app dependency tree.
const TEST_PASSWORD = 'TestAdmin123!';
const TEST_PASSWORD_HASH =
  's2:nafkj52dvd7u4t4i:493703b7bca0d47edf26a2c420d45b0ec324ac75fddaeabbe2d880783a1f387f00ad5ed8e324fb4a7cc1b14fb8862e1c2009c8cc9dbd32c74c3bed55ee7a07c1';

export class TestDataBuilder {
  private prisma: TestPrismaClient;

  constructor(connectionUri: string) {
    this.prisma = createTestPrisma(connectionUri);
  }

  async createUser(
    username: string,
    password?: string,
  ): Promise<{ userId: string; username: string; password: string }> {
    const userId = createId();
    const actualPassword = password ?? TEST_PASSWORD;

    // Only the pre-computed hash is supported for now
    if (actualPassword !== TEST_PASSWORD) {
      throw new Error(
        `TestDataBuilder only supports the default test password "${TEST_PASSWORD}". ` +
          'Pre-computing scrypt hashes at runtime requires lucia/utils.',
      );
    }

    await this.prisma.user.create({
      data: { id: userId, username },
    });

    const keyId = `username:${username.toLowerCase()}`;
    await this.prisma.key.create({
      data: { id: keyId, hashed_password: TEST_PASSWORD_HASH, user_id: userId },
    });

    log('setup', `Created user "${username}" (${userId})`);
    return { userId, username, password: actualPassword };
  }

  async createProtocol(opts?: {
    name?: string;
    description?: string;
  }): Promise<{
    id: string;
    hash: string;
    name: string;
  }> {
    const protocolId = createId();
    const name = opts?.name ?? 'Test Protocol';
    const description = opts?.description ?? 'A test protocol for E2E testing';
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
            content: 'Welcome to the test protocol.',
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
            text: 'Who are the people you spend time with?',
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
            name: {
              name: 'name',
              type: 'text',
            },
          },
        },
      },
      edge: {},
      ego: {
        variables: {},
      },
    };

    const protocol = {
      stages,
      codebook,
      schemaVersion: 8,
      lastModified: new Date().toISOString(),
      description,
    };

    const protocolHash = hash(protocol);

    await this.prisma.protocol.create({
      data: {
        id: protocolId,
        hash: protocolHash,
        name,
        schemaVersion: 8,
        description,
        lastModified: new Date(),
        stages,
        codebook,
        isPreview: false,
        isPending: false,
      },
    });

    log('setup', `Created protocol "${name}" (${protocolId})`);
    return { id: protocolId, hash: protocolHash, name };
  }

  async createParticipant(opts?: {
    identifier?: string;
    label?: string;
  }): Promise<{ id: string; identifier: string; label: string | null }> {
    const id = createId();
    const identifier = opts?.identifier ?? `P-${id.slice(0, 6)}`;
    const label = opts?.label ?? null;

    await this.prisma.participant.create({
      data: { id, identifier, label },
    });

    log('setup', `Created participant "${identifier}" (${id})`);
    return { id, identifier, label };
  }

  async createInterview(
    participantId: string,
    protocolId: string,
    opts?: {
      finished?: boolean;
      exported?: boolean;
      currentStep?: number;
      network?: Prisma.InputJsonValue;
    },
  ): Promise<{ id: string }> {
    const id = createId();
    const now = new Date();
    const finishTime = opts?.finished ? now : null;
    const exportTime = opts?.exported ? now : null;
    const currentStep = opts?.currentStep ?? 0;
    const network = opts?.network ?? {
      nodes: [],
      edges: [],
      ego: { _uid: createId(), attributes: {} },
    };

    await this.prisma.interview.create({
      data: {
        id,
        startTime: now,
        finishTime,
        exportTime,
        lastUpdated: now,
        network,
        participantId,
        protocolId,
        currentStep,
      },
    });

    log('setup', `Created interview (${id}) for participant ${participantId}`);
    return { id };
  }

  async createEvent(
    type: string,
    message: string,
    options?: { timestamp?: Date; id?: string },
  ): Promise<{ id: string }> {
    const id = options?.id ?? createId();
    const ts = options?.timestamp ?? new Date();

    await this.prisma.events.create({
      data: { id, timestamp: ts, type, message },
    });

    return { id };
  }

  async insertSettings(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.prisma.appSettings.upsert({
        where: { key: key as AppSetting },
        create: { key: key as AppSetting, value },
        update: { value },
      });
    }
  }

  async setupAppSettings(
    overrides?: Partial<Record<string, string>>,
  ): Promise<void> {
    const defaults: Record<string, string> = {
      configured: 'true',
      allowAnonymousRecruitment: 'true',
      limitInterviews: 'false',
      disableAnalytics: 'true',
      installationId: `test-${createId()}`,
      initializedAt: new Date().toISOString(),
      uploadThingToken: 'TEST_TOKEN',
      disableSmallScreenOverlay: 'false',
      previewModeRequireAuth: 'true',
    };

    const settings = { ...defaults, ...overrides };

    for (const [key, value] of Object.entries(settings)) {
      if (value === undefined) continue;
      await this.prisma.appSettings.upsert({
        where: { key: key as AppSetting },
        create: { key: key as AppSetting, value },
        update: { value },
      });
    }

    log('setup', 'App settings configured');
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
