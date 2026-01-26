import * as http from 'node:http';
import pg from 'pg';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { logger } from '../utils/logger';
import type { NativeAppEnvironment } from './native-app-environment';

type SuiteRegistration = {
  container: StartedPostgreSqlContainer;
  port: number; // Next.js port (stays constant)
  databaseUrl: string;
};

type SqlSnapshot = {
  name: string;
  data: string; // SQL dump content
  createdAt: Date;
};

/**
 * HTTP server that provides snapshot/restore operations for testcontainers.
 * Runs in the global setup process and is accessible to worker processes via HTTP.
 *
 * When restoring a snapshot:
 * 1. Restores the database container to the snapshot state
 * 2. Restarts the Next.js server with the (potentially new) database URL
 * 3. Returns the updated URLs to the worker
 */
export class SnapshotServer {
  private server: http.Server | null = null;
  private suites = new Map<string, SuiteRegistration>();
  private nativeApp: NativeAppEnvironment | null = null;
  private serverPort: number | null = null;
  // SQL-based snapshots: Map<suiteId, Map<snapshotName, SqlSnapshot>>
  private sqlSnapshots = new Map<string, Map<string, SqlSnapshot>>();

  /**
   * Set the NativeAppEnvironment for restarting Next.js processes.
   */
  setNativeAppEnvironment(nativeApp: NativeAppEnvironment) {
    this.nativeApp = nativeApp;
  }

  /**
   * Register a suite's container and app configuration.
   */
  registerSuite(
    suiteId: string,
    container: StartedPostgreSqlContainer,
    nextjsPort: number,
  ) {
    this.suites.set(suiteId, {
      container,
      port: nextjsPort,
      databaseUrl: container.getConnectionUri(),
    });
  }

  /**
   * Start the HTTP server on an available port.
   */
  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res).catch((error) => {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: message }));
        });
      });

      this.server.listen(0, '127.0.0.1', () => {
        const address = this.server?.address();
        if (address && typeof address === 'object') {
          this.serverPort = address.port;
          const url = `http://127.0.0.1:${this.serverPort}`;
          logger.info(`Snapshot server started at ${url}`);
          resolve(url);
        } else {
          reject(new Error('Failed to get server address'));
        }
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Stop the HTTP server.
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          this.serverPort = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) {
    const url = new URL(req.url ?? '/', `http://localhost`);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    // Expected paths:
    // POST /snapshot/:suiteId/:name - Create a snapshot
    // POST /restore/:suiteId/:name - Restore to a snapshot (restarts Next.js)
    // POST /clear-cache/:suiteId - Clear Next.js cache (restarts server)
    if (pathParts.length < 2) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error:
            'Invalid path. Expected /snapshot/:suiteId/:name or /restore/:suiteId/:name',
        }),
      );
      return;
    }

    const [action, suiteId, name] = pathParts;
    const suite = this.suites.get(suiteId!);

    if (!suite) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Suite not found: ${suiteId}` }));
      return;
    }

    if (action === 'snapshot') {
      await this.handleSnapshot(suiteId!, suite, name, res);
    } else if (action === 'restore') {
      await this.handleRestore(suiteId!, suite, name, res);
    } else if (action === 'clear-cache') {
      await this.handleClearCache(suiteId!, suite, res);
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Unknown action: ${action}` }));
    }
  }

  /**
   * Create a pool connection for a suite's database
   */
  private createPool(suite: SuiteRegistration): pg.Pool {
    return new pg.Pool({
      connectionString: suite.databaseUrl,
      max: 1,
    });
  }

  /**
   * Tables to exclude from snapshot/restore operations.
   * These tables are related to authentication and must be preserved
   * to maintain browser session validity:
   * - User: User accounts (sessions reference users via foreign key)
   * - Session: Browser session records (matched by cookies)
   * - Key: Lucia auth keys/credentials table
   * - _prisma_migrations: Schema tracking, never changes during tests
   */
  private static readonly EXCLUDED_TABLES = [
    'User',
    'Session',
    'Key',
    '_prisma_migrations',
  ];

  /**
   * Get all table names in the public schema (excluding auth and migration tables)
   */
  private async getTableNames(pool: pg.Pool): Promise<string[]> {
    const excludedList = SnapshotServer.EXCLUDED_TABLES.map(
      (t) => `'${t}'`,
    ).join(', ');
    const result = await pool.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables
       WHERE schemaname = 'public'
       AND tablename NOT IN (${excludedList})
       ORDER BY tablename`,
    );
    return result.rows.map((row) => row.tablename);
  }

  /**
   * Dump all data from a table as INSERT statements
   */
  private async dumpTable(
    pool: pg.Pool,
    tableName: string,
  ): Promise<{ tableName: string; rows: Record<string, unknown>[] }> {
    const result = await pool.query(`SELECT * FROM "${tableName}"`);
    return { tableName, rows: result.rows as Record<string, unknown>[] };
  }

  private async handleSnapshot(
    suiteId: string,
    suite: SuiteRegistration,
    name: string | undefined,
    res: http.ServerResponse,
  ) {
    const snapshotName = name ?? 'default';
    logger.info(
      `Creating SQL snapshot '${snapshotName}' for suite '${suiteId}'`,
    );

    const pool = this.createPool(suite);

    try {
      // Get all table names
      const tableNames = await this.getTableNames(pool);

      // Dump data from all tables
      const tableData: {
        tableName: string;
        rows: Record<string, unknown>[];
      }[] = [];
      for (const tableName of tableNames) {
        const data = await this.dumpTable(pool, tableName);
        tableData.push(data);
      }

      // Store the snapshot as JSON (simpler than SQL, easier to restore)
      const snapshotData = JSON.stringify(tableData);

      if (!this.sqlSnapshots.has(suiteId)) {
        this.sqlSnapshots.set(suiteId, new Map());
      }
      this.sqlSnapshots.get(suiteId)!.set(snapshotName, {
        name: snapshotName,
        data: snapshotData,
        createdAt: new Date(),
      });

      logger.info(
        `SQL snapshot '${snapshotName}' created for suite '${suiteId}' (${snapshotData.length} bytes, ${tableData.length} tables)`,
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          action: 'snapshot',
          suiteId,
          name: snapshotName,
          size: snapshotData.length,
          tables: tableNames.length,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.info(`Failed to create snapshot: ${message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: message }));
    } finally {
      await pool.end();
    }
  }

  private async handleClearCache(
    suiteId: string,
    suite: SuiteRegistration,
    res: http.ServerResponse,
  ) {
    if (!this.nativeApp) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'NativeAppEnvironment not configured' }));
      return;
    }

    logger.info(`Clearing Next.js cache for suite '${suiteId}'`);

    // Restart the Next.js server to clear in-memory caches
    await this.nativeApp.stop(suiteId);
    const appContext = await this.nativeApp.start({
      suiteId,
      port: suite.port,
      databaseUrl: suite.databaseUrl,
    });

    logger.info(`Cache cleared for suite '${suiteId}'`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        action: 'clear-cache',
        suiteId,
        appUrl: appContext.url,
      }),
    );
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

  private async handleRestore(
    suiteId: string,
    suite: SuiteRegistration,
    name: string | undefined,
    res: http.ServerResponse,
  ) {
    const snapshotName = name ?? 'default';
    logger.info(
      `Restoring SQL snapshot '${snapshotName}' for suite '${suiteId}'`,
    );

    // Get the stored snapshot
    const suiteSnapshots = this.sqlSnapshots.get(suiteId);
    const snapshot = suiteSnapshots?.get(snapshotName);

    if (!snapshot) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: `Snapshot '${snapshotName}' not found for suite '${suiteId}'`,
        }),
      );
      return;
    }

    const pool = this.createPool(suite);

    try {
      // Parse the snapshot data
      const tableData = JSON.parse(snapshot.data) as {
        tableName: string;
        rows: Record<string, unknown>[];
      }[];

      // Get the list of table names from the snapshot (these are the tables we need to restore)
      const snapshotTableNames = tableData.map((t) => t.tableName);

      logger.info(
        `Restoring ${snapshotTableNames.length} tables for suite '${suiteId}'`,
      );

      // Use a transaction with SERIALIZABLE isolation to prevent race conditions
      // with the running Next.js app that might insert data between DELETE and INSERT
      await pool.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

      try {
        // 1. Disable foreign key checks
        await pool.query('SET session_replication_role = replica');

        // 2. Delete all data from tables that are in the snapshot
        // Use TRUNCATE for atomic deletion (faster and prevents race conditions)
        // CASCADE handles foreign key references
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

        logger.info(
          `SQL restore complete for suite '${suiteId}' (${totalRows} rows restored)`,
        );

        // NOTE: No need to restart Next.js - the database connection remains valid
        // and browser sessions are preserved since we didn't change anything about auth

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            action: 'restore',
            suiteId,
            name: snapshotName,
            databaseUrl: suite.databaseUrl,
            rowsRestored: totalRows,
          }),
        );
      } catch (txError) {
        // Rollback on any error within the transaction
        await pool.query('ROLLBACK');
        throw txError;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.info(`Failed to restore snapshot: ${message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: message }));
    } finally {
      await pool.end();
    }
  }
}
