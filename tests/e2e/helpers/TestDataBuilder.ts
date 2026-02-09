import { createId } from '@paralleldrive/cuid2';
import { hash } from 'ohash';
import pg from 'pg';
import { log } from './logger.js';

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
  private pool: pg.Pool;

  constructor(connectionUri: string) {
    this.pool = new pg.Pool({
      connectionString: connectionUri,
      max: 3,
    });
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

    await this.pool.query(`INSERT INTO "User" (id, username) VALUES ($1, $2)`, [
      userId,
      username,
    ]);

    const keyId = `username:${username.toLowerCase()}`;
    await this.pool.query(
      `INSERT INTO "Key" (id, hashed_password, user_id) VALUES ($1, $2, $3)`,
      [keyId, TEST_PASSWORD_HASH, userId],
    );

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

    await this.pool.query(
      `INSERT INTO "Protocol" (id, hash, name, "schemaVersion", description, "importedAt", "lastModified", stages, codebook, "isPreview", "isPending")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7, false, false)`,
      [
        protocolId,
        protocolHash,
        name,
        8,
        description,
        JSON.stringify(stages),
        JSON.stringify(codebook),
      ],
    );

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

    await this.pool.query(
      `INSERT INTO "Participant" (id, identifier, label) VALUES ($1, $2, $3)`,
      [id, identifier, label],
    );

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
      network?: Record<string, unknown>;
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

    await this.pool.query(
      `INSERT INTO "Interview" (id, "startTime", "finishTime", "exportTime", "lastUpdated", network, "participantId", "protocolId", "currentStep")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        now,
        finishTime,
        exportTime,
        now,
        JSON.stringify(network),
        participantId,
        protocolId,
        currentStep,
      ],
    );

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
    await this.pool.query(
      `INSERT INTO "Events" (id, timestamp, type, message) VALUES ($1, $2, $3, $4)`,
      [id, ts, type, message],
    );
    return { id };
  }

  async insertSettings(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.pool.query(
        `INSERT INTO "AppSettings" (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        [key, value],
      );
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
      await this.pool.query(
        `INSERT INTO "AppSettings" (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        [key, value],
      );
    }

    log('setup', 'App settings configured');
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
