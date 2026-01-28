import { type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { log } from '../helpers/logger.js';

type TableSnapshot = {
  table: string;
  rows: Record<string, unknown>[];
};

const ISOLATION_LOCK_ID = 42;

export class DatabaseIsolation {
  private databaseUrl: string;
  private suiteId: string;

  constructor(databaseUrl: string, suiteId: string) {
    this.databaseUrl = databaseUrl;
    this.suiteId = suiteId;
  }

  getDatabaseUrl(): string {
    return this.databaseUrl;
  }

  async getProtocolId(): Promise<string> {
    const pool = new pg.Pool({ connectionString: this.databaseUrl, max: 1 });
    try {
      const result = await pool.query<{ id: string }>(
        `SELECT id FROM "Protocol" LIMIT 1`,
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error('No protocol found in database');
      }
      return row.id;
    } finally {
      await pool.end();
    }
  }

  async updateAppSetting(key: string, value: string): Promise<void> {
    const pool = new pg.Pool({ connectionString: this.databaseUrl, max: 1 });
    try {
      await pool.query(`UPDATE "AppSettings" SET value = $2 WHERE key = $1`, [
        key,
        value,
      ]);
    } finally {
      await pool.end();
    }
  }

  async getParticipantCount(identifier?: string): Promise<number> {
    const pool = new pg.Pool({ connectionString: this.databaseUrl, max: 1 });
    try {
      const result = identifier
        ? await pool.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM "Participant" WHERE identifier = $1`,
            [identifier],
          )
        : await pool.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM "Participant"`,
          );
      return Number(result.rows[0]?.count ?? 0);
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
      `../.snapshots/${this.suiteId}/${name}.json`,
    );

    const data = await fs.readFile(snapshotFile, 'utf-8');
    const snapshot = JSON.parse(data) as TableSnapshot[];

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
  }

  async isolate(page: Page, name = 'initial'): Promise<() => Promise<void>> {
    const pool = new pg.Pool({
      connectionString: this.databaseUrl,
      max: 1,
    });
    const client = await pool.connect();

    // Serialize mutation tests across all spec files
    await client.query(`SELECT pg_advisory_lock(${ISOLATION_LOCK_ID})`);

    log('test', `Restoring snapshot "${name}" for suite "${this.suiteId}"...`);
    await this.restoreWith(client, name);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    return async () => {
      try {
        await this.restoreWith(client, name);
      } finally {
        await client.query(`SELECT pg_advisory_unlock(${ISOLATION_LOCK_ID})`);
        client.release();
        await pool.end();
      }
    };
  }
}
