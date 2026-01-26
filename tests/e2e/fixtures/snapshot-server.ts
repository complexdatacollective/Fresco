import * as http from 'node:http';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { logger } from '../utils/logger';
import type { NativeAppEnvironment } from './native-app-environment';

type SuiteRegistration = {
  container: StartedPostgreSqlContainer;
  port: number; // Next.js port (stays constant)
  databaseUrl: string; // May change after restore
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

  private async handleSnapshot(
    suiteId: string,
    suite: SuiteRegistration,
    name: string | undefined,
    res: http.ServerResponse,
  ) {
    logger.info(
      `Creating snapshot '${name ?? 'default'}' for suite '${suiteId}'`,
    );

    await suite.container.snapshot(name);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        action: 'snapshot',
        suiteId,
        name: name ?? 'default',
      }),
    );
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

  private async handleRestore(
    suiteId: string,
    suite: SuiteRegistration,
    name: string | undefined,
    res: http.ServerResponse,
  ) {
    if (!this.nativeApp) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'NativeAppEnvironment not configured' }));
      return;
    }

    logger.info(
      `Restoring snapshot '${name ?? 'default'}' for suite '${suiteId}'`,
    );

    // 1. Stop the Next.js server first (so it releases DB connections)
    logger.info(`Stopping Next.js for suite '${suiteId}'`);
    await this.nativeApp.stop(suiteId);

    // 2. Restore the database container to the snapshot
    logger.info(`Restoring database container for suite '${suiteId}'`);
    await suite.container.restoreSnapshot(name);

    // 3. Get the new database URL (may have changed if container restarted with new port)
    const newDatabaseUrl = suite.container.getConnectionUri();
    suite.databaseUrl = newDatabaseUrl;

    // 4. Start Next.js with the (potentially new) database URL
    logger.info(
      `Starting Next.js for suite '${suiteId}' with database URL: ${newDatabaseUrl}`,
    );
    const appContext = await this.nativeApp.start({
      suiteId,
      port: suite.port,
      databaseUrl: newDatabaseUrl,
    });

    logger.info(`Restore complete for suite '${suiteId}'`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        action: 'restore',
        suiteId,
        name: name ?? 'default',
        appUrl: appContext.url,
        databaseUrl: newDatabaseUrl,
      }),
    );
  }
}
