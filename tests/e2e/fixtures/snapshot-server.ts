import * as http from 'node:http';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { logger } from '../utils/logger';
import type { NativeAppEnvironment } from './native-app-environment';

type SuiteRegistration = {
  container: StartedPostgreSqlContainer;
  port: number; // Next.js port (stays constant)
  databaseUrl: string;
};

/**
 * HTTP server that provides cache clearing operations for test workers.
 * Runs in the global setup process and is accessible to worker processes via HTTP.
 *
 * Snapshot create/restore operations are now handled directly by the
 * snapshot-client.ts using file-based storage, eliminating the need for
 * HTTP coordination for most operations.
 *
 * This server only handles:
 * - POST /clear-cache/:suiteId - Restart Next.js to clear in-memory caches
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

    // Expected path: POST /clear-cache/:suiteId
    if (pathParts.length < 2) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Invalid path. Expected /clear-cache/:suiteId',
        }),
      );
      return;
    }

    const [action, suiteId] = pathParts;
    const suite = this.suites.get(suiteId!);

    if (!suite) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Suite not found: ${suiteId}` }));
      return;
    }

    if (action === 'clear-cache') {
      await this.handleClearCache(suiteId!, suite, res);
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: `Unknown action: ${action}. Only 'clear-cache' is supported.`,
        }),
      );
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
}
