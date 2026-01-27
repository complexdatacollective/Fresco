/* eslint-disable no-process-env */
import { type ChildProcess, execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { log, logError } from './logger.js';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../../');
const STANDALONE_SERVER = path.join(PROJECT_ROOT, '.next/standalone/server.js');

let nextPort = 3100;

function allocatePort(): number {
  return nextPort++;
}

export function resetPortAllocation(): void {
  nextPort = 3100;
}

export class AppServer {
  url: string;
  port: number;
  private process: ChildProcess;

  private constructor(process: ChildProcess, port: number) {
    this.process = process;
    this.port = port;
    this.url = `http://localhost:${port}`;
  }

  static ensureBuild(): void {
    const serverExists = fs.existsSync(STANDALONE_SERVER);
    const forceRebuild = process.env.FORCE_REBUILD === 'true';

    if (serverExists && !forceRebuild) {
      log('setup', 'Standalone build already exists, skipping build');
      return;
    }

    log('setup', 'Building standalone Next.js app...');
    execSync('pnpm build', {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        SKIP_ENV_VALIDATION: 'true',
        DISABLE_NEXT_CACHE: 'true',
      },
      stdio: 'pipe',
    });

    // Copy static files into standalone dir
    const staticSrc = path.join(PROJECT_ROOT, '.next/static');
    const staticDest = path.join(PROJECT_ROOT, '.next/standalone/.next/static');
    if (fs.existsSync(staticSrc)) {
      execSync(`cp -r "${staticSrc}" "${staticDest}"`, { stdio: 'pipe' });
    }

    const publicSrc = path.join(PROJECT_ROOT, 'public');
    const publicDest = path.join(PROJECT_ROOT, '.next/standalone/public');
    if (fs.existsSync(publicSrc)) {
      execSync(`cp -r "${publicSrc}" "${publicDest}"`, { stdio: 'pipe' });
    }

    // Clear cache in standalone
    const cacheDir = path.join(PROJECT_ROOT, '.next/standalone/.next/cache');
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }

    log('setup', 'Build completed');
  }

  static async start(opts: {
    suiteId: string;
    port?: number;
    databaseUrl: string;
  }): Promise<AppServer> {
    const port = opts.port ?? allocatePort();
    log('setup', `Starting app server "${opts.suiteId}" on port ${port}...`);

    const child = spawn('node', [STANDALONE_SERVER], {
      cwd: path.join(PROJECT_ROOT, '.next/standalone'),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(port),
        HOSTNAME: '0.0.0.0',
        DATABASE_URL: opts.databaseUrl,
        DATABASE_URL_UNPOOLED: opts.databaseUrl,
        SKIP_ENV_VALIDATION: 'true',
        DISABLE_ANALYTICS: 'true',
        DISABLE_NEXT_CACHE: 'true',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const server = new AppServer(child, port);

    child.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) {
        log('info', `[${opts.suiteId}:stdout] ${msg}`);
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) {
        log('info', `[${opts.suiteId}:stderr] ${msg}`);
      }
    });

    child.on('error', (error) => {
      logError('setup', `App server "${opts.suiteId}" process error`, error);
    });

    await server.waitForReady();
    log('setup', `App server "${opts.suiteId}" ready at ${server.url}`);
    return server;
  }

  async waitForReady(timeoutMs = 30000): Promise<void> {
    const start = Date.now();
    const pollInterval = 500;

    while (Date.now() - start < timeoutMs) {
      try {
        const response = await fetch(this.url, {
          redirect: 'manual',
          signal: AbortSignal.timeout(2000),
        });
        // Any response (including redirects) means server is up
        if (response.status > 0) {
          return;
        }
      } catch {
        // Server not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new Error(
      `App server on port ${this.port} failed to start within ${timeoutMs}ms`,
    );
  }

  async stop(): Promise<void> {
    log('teardown', `Stopping app server on port ${this.port}...`);
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        log('teardown', `Force killing app server on port ${this.port}`);
        this.process.kill('SIGKILL');
        resolve();
      }, 5000);

      this.process.once('exit', () => {
        clearTimeout(timeout);
        log('teardown', `App server on port ${this.port} stopped`);
        resolve();
      });

      this.process.kill('SIGTERM');
    });
  }
}
