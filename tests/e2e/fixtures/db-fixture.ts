import { createId } from '@paralleldrive/cuid2';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { hash } from 'ohash';
import pg from 'pg';
import { type Prisma } from '~/lib/db/generated/client';
import { log } from '../helpers/logger.js';
import { createTestPrisma, type TestPrismaClient } from '../helpers/prisma.js';

type TableSnapshot = {
  table: string;
  rows: Record<string, unknown>[];
};

export class DatabaseIsolation {
  private databaseUrl: string;
  private suiteId: string;
  private prisma: TestPrismaClient;

  constructor(databaseUrl: string, suiteId: string) {
    this.databaseUrl = databaseUrl;
    this.suiteId = suiteId;
    this.prisma = createTestPrisma(databaseUrl);
  }

  getDatabaseUrl(): string {
    return this.databaseUrl;
  }

  private async query<T extends pg.QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<pg.QueryResult<T>> {
    const pool = new pg.Pool({ connectionString: this.databaseUrl, max: 1 });
    try {
      return await pool.query<T>(text, values);
    } finally {
      await pool.end();
    }
  }

  private async restoreWith(
    client: pg.PoolClient,
    name: string,
  ): Promise<void> {
    const snapshotFile = path.resolve(
      import.meta.dirname,
      `../.db-snapshots/${this.suiteId}/${name}.json`,
    );

    const data = await fs.readFile(snapshotFile, 'utf-8');
    const snapshot = JSON.parse(data) as TableSnapshot[];

    await client.query('SET lock_timeout = 5000');
    try {
      await client.query('BEGIN');
      await client.query('SET session_replication_role = replica');

      for (const { table } of snapshot) {
        await client.query(`TRUNCATE "${table}" CASCADE`);
      }

      for (const { table, rows } of snapshot) {
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = Object.values(row).map((v) =>
            v !== null && typeof v === 'object' && !(v instanceof Date)
              ? JSON.stringify(v)
              : v,
          );
          const placeholders = columns.map((_, i) => `$${i + 1}`);
          await client.query(
            `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`,
            values,
          );
        }
      }

      await client.query('SET session_replication_role = DEFAULT');
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {
        // Ignore rollback errors
      });
      throw error;
    } finally {
      await client.query('SET lock_timeout = 0');
    }
  }

  async restoreSnapshot(name = 'initial'): Promise<void> {
    const pool = new pg.Pool({
      connectionString: this.databaseUrl,
      max: 1,
    });
    const client = await pool.connect();

    try {
      log(
        'test',
        `Restoring snapshot "${name}" for suite "${this.suiteId}"...`,
      );
      await this.restoreWith(client, name);
    } finally {
      client.release();
      await pool.end();
    }
  }

  // ============================================================
  // Preview Mode Helpers
  // ============================================================

  async enablePreviewMode(requireAuth = false): Promise<void> {
    await this.prisma.appSettings.upsert({
      where: { key: 'previewMode' },
      create: { key: 'previewMode', value: 'true' },
      update: { value: 'true' },
    });
    await this.prisma.appSettings.upsert({
      where: { key: 'previewModeRequireAuth' },
      create: { key: 'previewModeRequireAuth', value: String(requireAuth) },
      update: { value: String(requireAuth) },
    });
    log('test', `Enabled preview mode (requireAuth: ${requireAuth})`);
  }

  async disablePreviewMode(): Promise<void> {
    await this.prisma.appSettings.upsert({
      where: { key: 'previewMode' },
      create: { key: 'previewMode', value: 'false' },
      update: { value: 'false' },
    });
    log('test', 'Disabled preview mode');
  }

  async createPreviewProtocol(options?: {
    isPending?: boolean;
    name?: string;
  }): Promise<string> {
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

    await this.prisma.previewProtocol.create({
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

  async deletePreviewProtocol(protocolId: string): Promise<void> {
    await this.prisma.previewProtocol
      .delete({
        where: { id: protocolId },
      })
      .catch(() => {
        // Ignore if not found
      });
  }

  async createPreviewProtocolFromJson(
    protocolData: Record<string, unknown>,
    options?: {
      isPending?: boolean;
      name?: string;
    },
  ): Promise<string> {
    const protocolId = createId();
    const name =
      options?.name ?? (protocolData.name as string) ?? `preview-${Date.now()}`;

    const protocolHash = hash(protocolData);

    await this.prisma.previewProtocol.create({
      data: {
        id: protocolId,
        hash: protocolHash,
        name,
        schemaVersion: protocolData.schemaVersion as number,
        description: (protocolData.description as string) ?? '',
        lastModified: new Date(protocolData.lastModified as string),
        stages: protocolData.stages as Prisma.InputJsonValue,
        codebook: protocolData.codebook as Prisma.InputJsonValue,
        isPending: options?.isPending ?? false,
      },
    });

    log('test', `Created preview protocol from JSON "${name}" (${protocolId})`);
    return protocolId;
  }

  async createApiToken(description: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');

    await this.prisma.apiToken.create({
      data: {
        id: createId(),
        token,
        description,
        isActive: true,
      },
    });

    log('test', `Created API token "${description}"`);
    return token;
  }

  async getInterviewCount(): Promise<number> {
    return this.prisma.interview.count();
  }
}
