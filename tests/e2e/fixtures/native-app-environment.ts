import { spawn, type ChildProcess, execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { NATIVE_APP_CONFIG, TEST_ENVIRONMENT } from '../config/test-config';
import { logger } from '../utils/logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../../..');
const execFileAsync = promisify(execFile);

export type NativeAppContext = {
  url: string;
  port: number;
  process: ChildProcess;
};

type AppInstance = {
  suiteId: string;
  port: number;
  process: ChildProcess;
  url: string;
  exitCode: number | null;
  exitSignal: NodeJS.Signals | null;
  hasExited: boolean;
  stderrOutput: string[];
};

export class NativeAppEnvironment {
  private static nextPort = NATIVE_APP_CONFIG.basePort;
  private instances = new Map<string, AppInstance>();

  static allocatePort(): number {
    const port = NativeAppEnvironment.nextPort;
    NativeAppEnvironment.nextPort++;
    return port;
  }

  static resetPortAllocation(): void {
    NativeAppEnvironment.nextPort = NATIVE_APP_CONFIG.basePort;
  }

  /**
   * Check if the standalone build exists and is fresh enough
   */
  async isBuildValid(
    maxAgeMs = NATIVE_APP_CONFIG.maxBuildAgeMs,
  ): Promise<boolean> {
    const serverPath = path.join(projectRoot, '.next/standalone/server.js');

    try {
      const stat = await fs.stat(serverPath);
      const age = Date.now() - stat.mtimeMs;
      return age < maxAgeMs;
    } catch {
      return false;
    }
  }

  /**
   * Run Prisma migrations for a database
   */
  async runMigrations(databaseUrl: string, suiteId: string): Promise<void> {
    logger.nativeApp.runningMigrations(suiteId);

    try {
      await execFileAsync('npx', ['prisma', 'migrate', 'deploy'], {
        cwd: projectRoot,
        env: {
          // eslint-disable-next-line no-process-env
          ...process.env,
          DATABASE_URL: databaseUrl,
          DATABASE_URL_UNPOOLED: databaseUrl,
          SKIP_ENV_VALIDATION: 'true',
        },
      });
      logger.nativeApp.migrationsComplete(suiteId);
    } catch (error) {
      logger.nativeApp.migrationsError(suiteId, error);
      throw error;
    }
  }

  /**
   * Start a Next.js instance from the standalone build
   */
  async start(config: {
    suiteId: string;
    port: number;
    databaseUrl: string;
  }): Promise<NativeAppContext> {
    const { suiteId, port, databaseUrl } = config;

    logger.nativeApp.starting(suiteId, port);

    const serverPath = path.join(projectRoot, '.next/standalone/server.js');

    // Check that the server file exists
    try {
      await fs.access(serverPath);
    } catch {
      throw new Error(
        `Standalone server not found at ${serverPath}. Run 'pnpm build' first.`,
      );
    }

    const instance: AppInstance = {
      suiteId,
      port,
      process: null as unknown as ChildProcess,
      url: `http://localhost:${port}`,
      exitCode: null,
      exitSignal: null,
      hasExited: false,
      stderrOutput: [],
    };

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
        UPLOADTHING_TOKEN: TEST_ENVIRONMENT.uploadThingToken,
        // Disable analytics in test
        DISABLE_ANALYTICS: 'true',
        // Disable Next.js cache for test isolation (handled by custom cache handler)
        DISABLE_NEXT_CACHE: 'true',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    instance.process = childProcess;

    // Attach log handlers
    childProcess.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString('utf-8').split('\n');
      for (const line of lines) {
        if (line.trim()) {
          logger.nativeApp.log(suiteId, line);
        }
      }
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString('utf-8').split('\n');
      for (const line of lines) {
        if (line.trim()) {
          instance.stderrOutput.push(line);
          logger.nativeApp.errorLog(suiteId, line);
        }
      }
    });

    childProcess.on('error', (error) => {
      logger.nativeApp.processError(suiteId, error);
    });

    childProcess.on('exit', (code, signal) => {
      instance.hasExited = true;
      instance.exitCode = code;
      instance.exitSignal = signal;
      logger.nativeApp.processExit(suiteId, code, signal);
    });

    // Store instance early so we can access it during health checks
    this.instances.set(suiteId, instance);

    // Wait for the app to be ready
    await this.waitForReady(instance);

    logger.nativeApp.started(suiteId, port, instance.url);

    return { url: instance.url, port, process: childProcess };
  }

  /**
   * Wait for the app to respond to health checks
   */
  private async waitForReady(
    instance: AppInstance,
    timeoutMs = NATIVE_APP_CONFIG.healthCheckTimeoutMs,
  ): Promise<void> {
    const startTime = Date.now();
    const pollInterval = NATIVE_APP_CONFIG.healthCheckPollMs;
    const { url, suiteId } = instance;

    while (Date.now() - startTime < timeoutMs) {
      // Check if the process has crashed
      if (instance.hasExited) {
        const stderrSummary = instance.stderrOutput.slice(-20).join('\n');
        throw new Error(
          `App ${suiteId} process exited unexpectedly with code ${instance.exitCode} (signal: ${instance.exitSignal}).\n` +
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
      `Timeout waiting for app ${suiteId} to be ready at ${url} after ${timeoutMs}ms.\n` +
        `Process still running: ${!instance.hasExited}\n` +
        `Last stderr output:\n${stderrSummary || '(no output)'}`,
    );
  }

  /**
   * Stop a running Next.js instance
   */
  async stop(suiteId: string): Promise<void> {
    const instance = this.instances.get(suiteId);
    if (!instance) return;

    logger.nativeApp.stopping(suiteId);

    const { process: childProcess } = instance;

    // Already exited, just clean up
    if (instance.hasExited) {
      this.instances.delete(suiteId);
      logger.nativeApp.stopped(suiteId);
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
          logger.nativeApp.forceKilling(suiteId);
          childProcess.kill('SIGKILL');
        }
        resolve();
      }, NATIVE_APP_CONFIG.shutdownTimeoutMs);
    });

    await Promise.race([exitPromise, timeoutPromise]);

    this.instances.delete(suiteId);
    logger.nativeApp.stopped(suiteId);
  }

  /**
   * Stop all running instances
   */
  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.instances.keys()).map((suiteId) =>
      this.stop(suiteId),
    );
    await Promise.all(stopPromises);
  }

  /**
   * Get a running instance by suiteId
   */
  getInstance(suiteId: string): AppInstance | undefined {
    return this.instances.get(suiteId);
  }
}
