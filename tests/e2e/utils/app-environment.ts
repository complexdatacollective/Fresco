import { spawn, type ChildProcess } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../../..');

// Starting port for native app instances
const BASE_PORT = 3100;
// Interval between health check polls
const HEALTH_CHECK_POLL_MS = 500;
// Timeout waiting for app to be ready
const HEALTH_CHECK_TIMEOUT_MS = 60000;
// Timeout waiting for graceful shutdown before force kill
const SHUTDOWN_TIMEOUT_MS = 5000;

export type AppInstance = {
  port: number;
  process: ChildProcess;
  url: string;
  exitCode: number | null;
  exitSignal: NodeJS.Signals | null;
  hasExited: boolean;
  stderrOutput: string[];
};

export class AppEnvironment {
  private static nextPort = BASE_PORT;
  private instance?: AppInstance;
  private logger;

  static allocatePort(): number {
    const port = AppEnvironment.nextPort;
    AppEnvironment.nextPort++;
    return port;
  }

  static resetPortAllocation(): void {
    AppEnvironment.nextPort = BASE_PORT;
  }

  constructor(suiteId: string) {
    this.logger = logger.nativeApp(suiteId);
  }

  /**
   * Start a Next.js instance from the standalone build
   */
  async start(config: {
    suiteId: string;
    port: number;
    databaseUrl: string;
  }): Promise<AppInstance> {
    const { suiteId, port, databaseUrl } = config;

    this.logger.starting(port);

    const serverPath = path.join(projectRoot, '.next/standalone/server.js');

    // Check that the server file exists
    try {
      await fs.access(serverPath);
    } catch {
      throw new Error(
        `Standalone server not found at ${serverPath}. Run 'pnpm build' first.`,
      );
    }

    const childProcess = spawn('node', [serverPath], {
      cwd: path.join(projectRoot, '.next/standalone'),
      env: {
        // eslint-disable-next-line no-process-env
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(port),
        HOSTNAME: '0.0.0.0',
        DATABASE_URL: databaseUrl,
        DATABASE_URL_UNPOOLED: databaseUrl,
        SKIP_ENV_VALIDATION: 'true',
        // Disable analytics in test
        DISABLE_ANALYTICS: 'true',
        // Disable Next.js cache for test isolation (handled by custom cache handler)
        DISABLE_NEXT_CACHE: 'true',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const instance: AppInstance = {
      port,
      process: childProcess,
      url: `http://localhost:${port}`,
      exitCode: null,
      exitSignal: null,
      hasExited: false,
      stderrOutput: [],
    };

    // Attach log handlers
    childProcess.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString('utf-8').split('\n');
      for (const line of lines) {
        if (line.trim()) {
          this.logger.log(line);
        }
      }
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString('utf-8').split('\n');
      for (const line of lines) {
        if (line.trim()) {
          instance.stderrOutput.push(line);
          this.logger.errorLog(line);
        }
      }
    });

    childProcess.on('error', (error) => {
      this.logger.processError(error);
    });

    childProcess.on('exit', (code, signal) => {
      instance.hasExited = true;
      instance.exitCode = code;
      instance.exitSignal = signal;
      this.logger.processExit(code, signal);
    });

    this.instance = instance;

    // Wait for the app to be ready
    await this.waitForReady(instance);

    this.logger.started(port, instance.url);

    return instance;
  }

  /**
   * Wait for the app to respond to health checks
   */
  private async waitForReady(
    instance: AppInstance,
    timeoutMs = HEALTH_CHECK_TIMEOUT_MS,
  ): Promise<void> {
    const startTime = Date.now();
    const pollInterval = HEALTH_CHECK_POLL_MS;
    const { url } = instance;

    while (Date.now() - startTime < timeoutMs) {
      // Check if the process has crashed
      if (instance.hasExited) {
        const stderrSummary = instance.stderrOutput.slice(-20).join('\n');
        throw new Error(
          `App ${instance.url} process exited unexpectedly with code ${instance.exitCode} (signal: ${instance.exitSignal}).\n` +
            `Last stderr output:\n${stderrSummary || '(no output)'}`,
        );
      }

      try {
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'manual', // Don't follow redirects, just check if server responds
          signal: AbortSignal.timeout(2000),
        });

        // Any response means the server is up - including redirects (3xx), not found (404), etc.
        // We just need to confirm the server is accepting connections
        if (response.status > 0) {
          return;
        }
      } catch {
        // Connection refused or timeout, keep polling
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    // Timeout - collect diagnostic info
    const stderrSummary = instance.stderrOutput.slice(-20).join('\n');
    throw new Error(
      `Timeout waiting for app to be ready at ${url} after ${timeoutMs}ms.\n` +
        `Process still running: ${!instance.hasExited}\n` +
        `Last stderr output:\n${stderrSummary || '(no output)'}`,
    );
  }

  /**
   * Stop a running Next.js instance
   */
  async stop(): Promise<void> {
    if (!this.instance) return;

    const instance = this.instance;

    this.logger.stopping();

    const { process: childProcess } = instance;
    // Already exited, just clean up
    if (instance.hasExited) {
      this.instance = undefined;
      this.logger.stopped();
      return;
    }

    // Try graceful shutdown with SIGTERM
    childProcess.kill('SIGTERM');

    // Wait for the process to exit, with timeout
    const exitPromise = new Promise<void>((resolve) => {
      childProcess.once('exit', () => resolve());
    });

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        // Force kill if still running
        if (!childProcess.killed) {
          this.logger.forceKilling();
          childProcess.kill('SIGKILL');
        }
        resolve();
      }, SHUTDOWN_TIMEOUT_MS);
    });

    await Promise.race([exitPromise, timeoutPromise]);

    this.instance = undefined;
    this.logger.stopped();
  }
}
