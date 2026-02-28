import { type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { log } from '../helpers/logger.js';

type TableSnapshot = {
  table: string;
  rows: Record<string, unknown>[];
};

// Advisory lock ID used for coordinating database access across workers.
// Shared locks allow parallel reads; exclusive locks serialize mutations.
const LOCK_ID = 42;

export class DatabaseIsolation {
  private databaseUrl: string;
  private suiteId: string;
  private isolationClient: pg.PoolClient | null = null;

  // Pool and client for holding the shared read lock across the spec file
  private readLockPool: pg.Pool | null = null;
  private readLockClient: pg.PoolClient | null = null;

  constructor(databaseUrl: string, suiteId: string) {
    this.databaseUrl = databaseUrl;
    this.suiteId = suiteId;
  }

  getDatabaseUrl(): string {
    return this.databaseUrl;
  }

  private async query<T extends pg.QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<pg.QueryResult<T>> {
    // Use the isolation client if available (during isolated test), otherwise create a temporary pool
    if (this.isolationClient) {
      return this.isolationClient.query<T>(text, values);
    }
    const pool = new pg.Pool({ connectionString: this.databaseUrl, max: 1 });
    try {
      return await pool.query<T>(text, values);
    } finally {
      await pool.end();
    }
  }

  async getProtocolId(): Promise<string> {
    const result = await this.query<{ id: string }>(
      `SELECT id FROM "Protocol" LIMIT 1`,
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('No protocol found in database');
    }
    return row.id;
  }

  async updateAppSetting(key: string, value: string): Promise<void> {
    await this.query(`UPDATE "AppSettings" SET value = $2 WHERE key = $1`, [
      key,
      value,
    ]);
  }

  async deleteUser(username: string): Promise<void> {
    await this.query(`DELETE FROM "User" WHERE "username" = $1`, [username]);
  }

  async getParticipantCount(identifier?: string): Promise<number> {
    const result = identifier
      ? await this.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM "Participant" WHERE identifier = $1`,
          [identifier],
        )
      : await this.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM "Participant"`,
        );
    return Number(result.rows[0]?.count ?? 0);
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

    // Set a short lock timeout for table locks during restore, but reset it
    // afterwards so advisory lock operations can wait indefinitely
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
        // Ignore rollback errors - we're already handling the original error
      });
      throw error;
    } finally {
      await client.query('SET lock_timeout = 0');
    }
  }

  /**
   * Acquires a shared read lock and restores the database snapshot.
   * The shared lock is held until releaseReadLock() is called.
   * Multiple workers can hold shared locks simultaneously (parallel reads).
   * Call this in beforeAll of each spec file.
   */
  async restoreSnapshot(name = 'initial'): Promise<void> {
    // Clean up any existing read lock (shouldn't happen, but be safe)
    await this.releaseReadLock();

    this.readLockPool = new pg.Pool({
      connectionString: this.databaseUrl,
      max: 1,
    });
    this.readLockClient = await this.readLockPool.connect();

    // Acquire shared lock - allows parallel reads, blocks during exclusive writes
    await this.readLockClient.query(
      `SELECT pg_advisory_lock_shared(${LOCK_ID})`,
    );
    log(
      'test',
      `Acquired shared lock and restoring snapshot "${name}" for suite "${this.suiteId}"...`,
    );
    await this.restoreWith(this.readLockClient, name);
    // Keep the shared lock held - it protects read-only tests from concurrent mutations
  }

  /**
   * Releases the shared read lock acquired by restoreSnapshot().
   * Call this in afterAll of each spec file.
   */
  async releaseReadLock(): Promise<void> {
    if (this.readLockClient) {
      try {
        await this.readLockClient.query(
          `SELECT pg_advisory_unlock_shared(${LOCK_ID})`,
        );
        log('test', `Released shared lock for suite "${this.suiteId}"`);
      } finally {
        this.readLockClient.release();
        this.readLockClient = null;
      }
    }
    if (this.readLockPool) {
      await this.readLockPool.end();
      this.readLockPool = null;
    }
  }

  /**
   * Isolates a mutation test by acquiring an exclusive lock and restoring the snapshot.
   * The exclusive lock blocks all other readers and writers until cleanup() is called.
   * Returns a cleanup function that must be called in afterEach.
   */
  async isolate(page: Page, name = 'initial'): Promise<() => Promise<void>> {
    // Release our shared lock first to avoid deadlock when acquiring exclusive lock.
    // Other workers holding shared locks will block our exclusive lock acquisition,
    // but we must not be one of them.
    const hadReadLock = !!this.readLockClient;
    if (hadReadLock) {
      await this.readLockClient!.query(
        `SELECT pg_advisory_unlock_shared(${LOCK_ID})`,
      );
      log('test', `Released shared lock before acquiring exclusive lock`);
    }

    // Navigate away BEFORE acquiring lock to stop app DB queries.
    // This prevents deadlocks where TRUNCATE waits for active Next.js queries.
    const currentUrl = page.url();
    await page.goto('about:blank');

    const pool = new pg.Pool({
      connectionString: this.databaseUrl,
      max: 1,
    });
    const client = await pool.connect();

    // Acquire exclusive lock - waits for all shared locks to release
    await client.query(`SELECT pg_advisory_lock(${LOCK_ID})`);
    log('test', `Acquired exclusive lock for mutation test`);

    // Store client so helper methods reuse this connection (protected by advisory lock)
    this.isolationClient = client;

    log('test', `Restoring snapshot "${name}" for suite "${this.suiteId}"...`);
    await this.restoreWith(client, name);

    // Navigate back after restore - use networkidle to ensure React hydration completes
    await page.goto(currentUrl, { waitUntil: 'networkidle' });

    return async () => {
      // Navigate away before cleanup restore to prevent deadlocks.
      // Wrap in try/catch because the page may have crashed during the test.
      try {
        await page.goto('about:blank');
      } catch {
        // Page crashed during the test - still need to restore DB and release lock
      }

      try {
        await this.restoreWith(client, name);
      } finally {
        this.isolationClient = null;
        await client.query(`SELECT pg_advisory_unlock(${LOCK_ID})`);
        log('test', `Released exclusive lock after mutation test`);
        client.release();
        await pool.end();

        // Re-acquire shared lock so subsequent read-only tests are protected
        if (hadReadLock && this.readLockClient) {
          await this.readLockClient.query(
            `SELECT pg_advisory_lock_shared(${LOCK_ID})`,
          );
          log('test', `Re-acquired shared lock after mutation test`);
        }
      }
    };
  }
}
