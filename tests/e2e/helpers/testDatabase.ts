/* eslint-disable no-process-env */
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { log, logError } from './logger.js';
import { createTestPrisma, type TestPrismaClient } from './prisma.js';

const SNAPSHOTS_DIR = path.resolve(import.meta.dirname, '../.db-snapshots');

// Tables excluded from snapshots (auth tables must survive restores so browser sessions stay valid)
const EXCLUDED_TABLES = ['User', 'Session', 'Key', '_prisma_migrations'];

type TableSnapshot = {
  table: string;
  rows: Record<string, unknown>[];
};

export class TestDatabase {
  container: StartedPostgreSqlContainer | null;
  connectionUri: string;
  suiteId: string;
  prisma: TestPrismaClient;

  private constructor(
    connectionUri: string,
    suiteId: string,
    container: StartedPostgreSqlContainer | null,
  ) {
    this.connectionUri = connectionUri;
    this.suiteId = suiteId;
    this.container = container;
    this.prisma = createTestPrisma(connectionUri);
  }

  static async start(): Promise<TestDatabase> {
    log('setup', 'Starting PostgreSQL container...');
    const container = await new PostgreSqlContainer('postgres:17-alpine')
      .withDatabase('fresco_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    const connectionUri = container.getConnectionUri();
    log('setup', `PostgreSQL started at ${connectionUri}`);
    return new TestDatabase(connectionUri, '', container);
  }

  static fromConnectionUri(
    connectionUri: string,
    suiteId: string,
  ): TestDatabase {
    return new TestDatabase(connectionUri, suiteId, null);
  }

  runMigrations(): void {
    log('setup', 'Running Prisma migrations...');
    const projectRoot = path.resolve(import.meta.dirname, '../../../');
    execSync('npx prisma migrate deploy', {
      cwd: projectRoot,
      env: {
        ...process.env,
        DATABASE_URL: this.connectionUri,
        DATABASE_URL_UNPOOLED: this.connectionUri,
        SKIP_ENV_VALIDATION: 'true',
      },
      stdio: 'pipe',
    });
    log('setup', 'Migrations completed');
  }

  async createSnapshot(name: string): Promise<void> {
    log('setup', `Creating snapshot "${name}" for suite "${this.suiteId}"...`);
    const pool = new pg.Pool({
      connectionString: this.connectionUri,
      max: 5,
    });

    try {
      const tablesResult = await pool.query<{ tablename: string }>(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
      );

      const tables = tablesResult.rows
        .map((r) => r.tablename)
        .filter((t) => !EXCLUDED_TABLES.includes(t));

      const snapshot: TableSnapshot[] = [];

      for (const table of tables) {
        const dataResult = await pool.query(`SELECT * FROM "${table}"`);
        snapshot.push({
          table,
          rows: dataResult.rows as Record<string, unknown>[],
        });
      }

      const snapshotDir = path.join(SNAPSHOTS_DIR, this.suiteId);
      await fs.mkdir(snapshotDir, { recursive: true });
      await fs.writeFile(
        path.join(snapshotDir, `${name}.json`),
        JSON.stringify(snapshot, null, 2),
      );

      log('setup', `Snapshot "${name}" created (${tables.length} tables)`);
    } finally {
      await pool.end();
    }
  }

  async restoreSnapshot(name = 'initial'): Promise<void> {
    const snapshotFile = path.join(SNAPSHOTS_DIR, this.suiteId, `${name}.json`);
    const data = await fs.readFile(snapshotFile, 'utf-8');
    const snapshot = JSON.parse(data) as TableSnapshot[];

    const pool = new pg.Pool({
      connectionString: this.connectionUri,
      max: 1,
    });
    const client = await pool.connect();

    try {
      log(
        'test',
        `Restoring snapshot "${name}" for suite "${this.suiteId}"...`,
      );
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
    } finally {
      client.release();
      await pool.end();
    }
  }

  async seedAndSnapshot(
    seedFn: (connectionUri: string) => Promise<void>,
    snapshotName: string,
  ): Promise<void> {
    await seedFn(this.connectionUri);
    await this.createSnapshot(snapshotName);
  }

  async stop(): Promise<void> {
    if (!this.container) return;
    log('teardown', 'Stopping PostgreSQL container...');
    try {
      await this.container.stop();
      log('teardown', 'PostgreSQL container stopped');
    } catch (error) {
      logError('teardown', 'Failed to stop PostgreSQL container', error);
    }
  }
}
