import { type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { log } from '../helpers/logger.js';
import { createTestPrisma, type TestPrismaClient } from '../helpers/prisma.js';
import { type AppSetting } from '~/lib/db/generated/client';

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
  private prisma: TestPrismaClient;
  private isolationClient: pg.PoolClient | null = null;

  // Pool and client for holding the shared read lock across the spec file
  private readLockPool: pg.Pool | null = null;
  private readLockClient: pg.PoolClient | null = null;

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
    const protocol = await this.prisma.protocol.findFirst({
      select: { id: true },
    });
    if (!protocol) {
      throw new Error('No protocol found in database');
    }
    return protocol.id;
  }

  async updateAppSetting(key: string, value: string): Promise<void> {
    await this.prisma.appSettings.update({
      where: { key: key as AppSetting },
      data: { value },
    });
  }

  async deleteUser(username: string): Promise<void> {
    await this.prisma.user.delete({ where: { username } }).catch(() => {
      // Ignore if user doesn't exist (e.g., first run or retry cleanup)
    });
  }

  async getParticipantCount(identifier?: string): Promise<number> {
    return this.prisma.participant.count({
      where: identifier ? { identifier } : undefined,
    });
  }

  async seedPasskeyForUser(
    username: string,
    credentialId: string,
    publicKey: string,
    options?: {
      aaguid?: string;
      friendlyName?: string;
      counter?: number;
      deviceType?: string;
      backedUp?: boolean;
    },
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) {
      throw new Error(`User "${username}" not found`);
    }

    await this.prisma.webAuthnCredential.create({
      data: {
        user_id: user.id,
        credentialId,
        publicKey,
        counter: BigInt(options?.counter ?? 0),
        transports: 'internal',
        deviceType: options?.deviceType ?? 'multiDevice',
        backedUp: options?.backedUp ?? true,
        aaguid: options?.aaguid ?? null,
        friendlyName: options?.friendlyName ?? 'Test Passkey',
      },
    });

    log('test', `Seeded passkey for user "${username}"`);
  }

  async clearPasskeysForUser(username: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) {
      throw new Error(`User "${username}" not found`);
    }

    await this.prisma.webAuthnCredential.deleteMany({
      where: { user_id: user.id },
    });

    log('test', `Cleared passkeys for user "${username}"`);
  }

  async removePasswordForUser(username: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) {
      throw new Error(`User "${username}" not found`);
    }

    await this.prisma.key.updateMany({
      where: { user_id: user.id },
      data: { hashed_password: null },
    });

    log('test', `Removed password for user "${username}"`);
  }

  async getUserPasskeyCount(username: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) {
      throw new Error(`User "${username}" not found`);
    }

    return this.prisma.webAuthnCredential.count({
      where: { user_id: user.id },
    });
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

    try {
      // Acquire exclusive lock for the restore to prevent concurrent TRUNCATEs
      // from deadlocking each other
      await this.readLockClient.query(`SELECT pg_advisory_lock(${LOCK_ID})`);
      log(
        'test',
        `Acquired exclusive lock for restoring snapshot "${name}" for suite "${this.suiteId}"...`,
      );
      await this.restoreWith(this.readLockClient, name);

      // Downgrade to shared lock: release exclusive, then acquire shared
      await this.readLockClient.query(`SELECT pg_advisory_unlock(${LOCK_ID})`);
      await this.readLockClient.query(
        `SELECT pg_advisory_lock_shared(${LOCK_ID})`,
      );
      log('test', `Downgraded to shared lock for suite "${this.suiteId}"`);
      // Keep the shared lock held - it protects read-only tests from concurrent mutations
    } catch (error) {
      // If anything fails (timeout, connection error), release the connection
      // immediately so the advisory lock is freed on disconnect and doesn't
      // poison other spec files sharing this database.
      this.readLockClient.release();
      this.readLockClient = null;
      await this.readLockPool.end();
      this.readLockPool = null;
      throw error;
    }
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
    let client: pg.PoolClient | null = null;

    try {
      client = await pool.connect();

      // Acquire exclusive lock - waits for all shared locks to release
      await client.query(`SELECT pg_advisory_lock(${LOCK_ID})`);
      log('test', `Acquired exclusive lock for mutation test`);

      // Store client so helper methods reuse this connection (protected by advisory lock)
      this.isolationClient = client;

      log(
        'test',
        `Restoring snapshot "${name}" for suite "${this.suiteId}"...`,
      );
      await this.restoreWith(client, name);

      // Navigate back after restore. 'load' is used instead of 'networkidle' because
      // WebKit keeps persistent connections (e.g. analytics) that prevent networkidle.
      await page.goto(currentUrl, { waitUntil: 'load' });
    } catch (error) {
      // If setup fails, release the connection so the advisory lock is freed
      // on disconnect and doesn't block other spec files.
      this.isolationClient = null;
      if (client) {
        client.release();
      }
      await pool.end();
      throw error;
    }

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

        // Release the exclusive advisory lock. Wrap in try/catch so a closed
        // client (e.g. from a prior timeout) doesn't prevent pool cleanup and
        // poison subsequent tests with an unreleased lock.
        try {
          await client.query(`SELECT pg_advisory_unlock(${LOCK_ID})`);
          log('test', `Released exclusive lock after mutation test`);
        } catch (unlockError) {
          log(
            'test',
            `Failed to release exclusive lock (will auto-release on disconnect): ${unlockError}`,
          );
        }

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
