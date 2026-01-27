import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TestInfo } from '@playwright/test';
import pg from 'pg';
import type { PrismaClient } from '~/lib/db/generated/client';
import { getWorkerContextInfo, type WorkerContext } from './context-resolver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOTS_DIR = path.join(__dirname, '../.snapshots');

type TableData = {
  tableName: string;
  rows: Record<string, unknown>[];
};

/**
 * Tables to exclude from snapshot/restore operations.
 * These tables are related to authentication and must be preserved
 * to maintain browser session validity:
 * - User: User accounts (sessions reference users via foreign key)
 * - Session: Browser session records (matched by cookies)
 * - Key: Lucia auth keys/credentials table
 * - _prisma_migrations: Schema tracking, never changes during tests
 */
const EXCLUDED_TABLES = ['User', 'Session', 'Key', '_prisma_migrations'];

/**
 * Database operations for test isolation using SQL-based snapshots.
 *
 * Uses TRUNCATE + INSERT with JSON file storage. SQL snapshots
 * are fast (~100ms) and don't break database connections, so no
 * Next.js restart is needed.
 *
 * Auth tables (User, Session, Key) are excluded from snapshots to
 * preserve browser sessions across restores.
 */
export class DatabaseSnapshots {
  private context: WorkerContext;
  private testInfo?: TestInfo;
  private _contextInfo: Awaited<
    ReturnType<typeof getWorkerContextInfo>
  > | null = null;
  private isolationDepth = 0;

  constructor(context: WorkerContext, testInfo?: TestInfo) {
    this.context = context;
    this.testInfo = testInfo;
  }

  /**
   * Initialize state tracking. Called automatically when the fixture is first used.
   */
  async initializeTracking(): Promise<void> {
    // No-op - state tracking is implicit in isolation depth
  }

  /**
   * Check if the database state was modified and not restored.
   * Returns a warning message if issues are detected, or null if everything is fine.
   */
  checkForUnrestoredChanges(): string | null {
    if (this.isolationDepth > 0) {
      return `Test ended with ${this.isolationDepth} unclosed isolation scope(s). Did you forget to call cleanup()?`;
    }
    return null;
  }

  /**
   * Get the current isolation state for debugging
   */
  getIsolationState(): { state: string; depth: number } {
    return {
      state: this.isolationDepth > 0 ? 'isolated' : 'none',
      depth: this.isolationDepth,
    };
  }

  /**
   * Get information about the resolved context for debugging
   */
  async getContextInfo() {
    if (!this._contextInfo && this.testInfo) {
      this._contextInfo = await getWorkerContextInfo(this.testInfo);
    }
    return (
      this._contextInfo ?? {
        resolvedContext: this.context.suiteId,
        availableContexts: [this.context.suiteId],
        detectionMethod: 'direct context',
        testFile: this.testInfo?.file,
        projectName: this.testInfo?.project?.name,
        baseURL: this.testInfo?.project?.use?.baseURL,
      }
    );
  }

  /**
   * Create an isolation context for test data modifications.
   *
   * Restores to the 'initial' snapshot BEFORE the test runs, ensuring
   * the test starts with a clean, known state regardless of what
   * previous tests may have done. Also restores after the test completes.
   *
   * The 'initial' snapshot is created in global-setup after seeding data
   * and contains the full test data set.
   *
   * @param name - Identifier for logging purposes
   * @returns A cleanup function that restores to the initial snapshot
   */
  async isolate(name?: string): Promise<() => Promise<void>> {
    this.isolationDepth++;
    const isolateName = name ?? 'isolate';

    // Restore to initial state BEFORE the test runs
    // This ensures the test always starts with clean, seeded data
    // eslint-disable-next-line no-console
    console.log(
      `[DB] Restoring to initial snapshot before test '${isolateName}' (suite: ${this.context.suiteId})`,
    );
    await this.restoreSnapshot('initial');
    // eslint-disable-next-line no-console
    console.log(`[DB] Restore complete for test '${isolateName}'`);

    return async () => {
      // Also restore to initial after the test completes
      // This is a safety net in case cleanup is called without error handling
      // eslint-disable-next-line no-console
      console.log(`[DB] Cleaning up after test '${isolateName}'`);
      await this.restoreSnapshot('initial');
      this.isolationDepth--;
    };
  }

  /**
   * Create a named snapshot of the current database state.
   * Stores the snapshot as a JSON file in .snapshots/<suiteId>/<name>.json
   *
   * @param name - Name for the snapshot
   */
  async createSnapshot(name: string): Promise<void> {
    const pool = this.createPool();

    try {
      // Get all table names
      const tableNames = await this.getTableNames(pool);

      // Dump data from all tables
      const tableData: TableData[] = [];
      for (const tableName of tableNames) {
        const data = await this.dumpTable(pool, tableName);
        tableData.push(data);
      }

      // Write to file
      const snapshotPath = this.getSnapshotPath(name);
      await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
      await fs.writeFile(snapshotPath, JSON.stringify(tableData, null, 2));

      // eslint-disable-next-line no-console
      console.log(
        `[DB] Created snapshot '${name}' for suite '${this.context.suiteId}' (${tableData.length} tables)`,
      );
    } finally {
      await pool.end();
    }
  }

  /**
   * Restore to a previously created snapshot.
   * SQL-based restore doesn't require Next.js restart - connections remain valid.
   *
   * Note: Auth tables (User, Session, Key) are excluded from snapshots,
   * so browser sessions remain valid after restore.
   *
   * @param name - Name of the snapshot to restore to
   */
  async restoreSnapshot(name: string): Promise<void> {
    const snapshotPath = this.getSnapshotPath(name);

    // Check if snapshot file exists
    try {
      await fs.access(snapshotPath);
    } catch {
      throw new Error(
        `Snapshot '${name}' not found for suite '${this.context.suiteId}' at ${snapshotPath}`,
      );
    }

    // Read snapshot data
    const snapshotContent = await fs.readFile(snapshotPath, 'utf-8');
    const tableData = JSON.parse(snapshotContent) as TableData[];

    const pool = this.createPool();

    try {
      // Get the list of table names from the snapshot
      const snapshotTableNames = tableData.map((t) => t.tableName);

      // Use a transaction with SERIALIZABLE isolation to prevent race conditions
      await pool.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

      try {
        // 1. Disable foreign key checks
        await pool.query('SET session_replication_role = replica');

        // 2. Truncate all tables that are in the snapshot
        if (snapshotTableNames.length > 0) {
          const tableList = snapshotTableNames.map((t) => `"${t}"`).join(', ');
          await pool.query(`TRUNCATE ${tableList} CASCADE`);
        }

        // 3. Restore data from snapshot
        let totalRows = 0;
        for (const { tableName, rows } of tableData) {
          if (rows.length > 0) {
            for (const row of rows) {
              const { sql, values } = this.buildInsertStatement(tableName, row);
              await pool.query(sql, values);
              totalRows++;
            }
          }
        }

        // 4. Re-enable foreign key checks
        await pool.query('SET session_replication_role = origin');

        // Commit the transaction
        await pool.query('COMMIT');

        // eslint-disable-next-line no-console
        console.log(
          `[DB] Restored snapshot '${name}' for suite '${this.context.suiteId}' (${totalRows} rows)`,
        );
      } catch (txError) {
        // Rollback on any error within the transaction
        await pool.query('ROLLBACK');
        throw txError;
      }
    } finally {
      await pool.end();
    }
  }

  /**
   * Run a function within a snapshot scope.
   * Automatically restores to the 'initial' state after the function completes.
   *
   * @param _name - Identifier for logging purposes
   * @param fn - Function to execute within the scope
   * @returns The result of the function
   */
  async withSnapshot<T>(_name: string, fn: () => Promise<T>): Promise<T> {
    const cleanup = await this.isolate(_name);
    try {
      return await fn();
    } finally {
      await cleanup();
    }
  }

  /**
   * Clear the Next.js cache by restarting the server.
   * Use this after modifying database settings that need to take effect immediately.
   */
  async clearNextCache(): Promise<void> {
    const url = `${this.context.snapshotServerUrl}/clear-cache/${this.context.suiteId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(
        `Failed to clear Next.js cache: ${data.error ?? `HTTP ${response.status}`}`,
      );
    }
  }

  /**
   * Get the file path for a snapshot
   */
  private getSnapshotPath(name: string): string {
    return path.join(SNAPSHOTS_DIR, this.context.suiteId, `${name}.json`);
  }

  /**
   * Create a PostgreSQL connection pool
   */
  private createPool(): pg.Pool {
    return new pg.Pool({
      connectionString: this.context.databaseUrl,
      max: 1,
    });
  }

  /**
   * Get all table names in the public schema (excluding auth and migration tables)
   */
  private async getTableNames(pool: pg.Pool): Promise<string[]> {
    const excludedList = EXCLUDED_TABLES.map((t) => `'${t}'`).join(', ');
    const result = await pool.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables
       WHERE schemaname = 'public'
       AND tablename NOT IN (${excludedList})
       ORDER BY tablename`,
    );
    return result.rows.map((row) => row.tablename);
  }

  /**
   * Dump all data from a table
   */
  private async dumpTable(
    pool: pg.Pool,
    tableName: string,
  ): Promise<TableData> {
    const result = await pool.query(`SELECT * FROM "${tableName}"`);
    return { tableName, rows: result.rows as Record<string, unknown>[] };
  }

  /**
   * Build an INSERT statement for a row of data.
   * Handles JSON columns by stringifying object/array values.
   */
  private buildInsertStatement(
    tableName: string,
    row: Record<string, unknown>,
  ): { sql: string; values: unknown[] } {
    const columns = Object.keys(row);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    // pg library automatically converts objects to JSON, but we need to ensure
    // proper handling of JSON columns by explicitly stringifying objects/arrays
    const values = columns.map((col) => {
      const value = row[col];
      // PostgreSQL JSON columns expect string input when using parameterized queries
      // pg library handles this, but nested objects from JSON.parse need explicit conversion
      if (value !== null && typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value;
    });

    return {
      sql: `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`,
      values,
    };
  }

  /**
   * Get access to the underlying Prisma client for direct database operations.
   * Note: After a restore, this client may have a stale connection.
   */
  get prisma(): PrismaClient {
    return this.context.prisma;
  }

  /**
   * Get the app URL for this context
   */
  get appUrl(): string {
    return this.context.appUrl;
  }

  /**
   * Get the suite ID for this context
   */
  get suiteId(): string {
    return this.context.suiteId;
  }

  /**
   * Get the test data for this context (only available for interview suite)
   */
  get testData() {
    return this.context.testData;
  }
}

/**
 * Static utility for creating snapshots from global-setup.
 * This is used before workers are started, so it operates directly on the database.
 */
export async function createInitialSnapshot(
  suiteId: string,
  databaseUrl: string,
): Promise<{ success: boolean; tables: number; size: number }> {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 1,
  });

  try {
    // Get all table names
    const excludedList = EXCLUDED_TABLES.map((t) => `'${t}'`).join(', ');
    const result = await pool.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables
       WHERE schemaname = 'public'
       AND tablename NOT IN (${excludedList})
       ORDER BY tablename`,
    );
    const tableNames = result.rows.map((row) => row.tablename);

    // Dump data from all tables
    const tableData: TableData[] = [];
    for (const tableName of tableNames) {
      const dataResult = await pool.query(`SELECT * FROM "${tableName}"`);
      tableData.push({
        tableName,
        rows: dataResult.rows as Record<string, unknown>[],
      });
    }

    // Write to file
    const snapshotPath = path.join(SNAPSHOTS_DIR, suiteId, 'initial.json');
    await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
    const content = JSON.stringify(tableData, null, 2);
    await fs.writeFile(snapshotPath, content);

    return {
      success: true,
      tables: tableNames.length,
      size: content.length,
    };
  } finally {
    await pool.end();
  }
}
