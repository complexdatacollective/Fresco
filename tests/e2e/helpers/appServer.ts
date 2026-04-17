/* eslint-disable no-process-env */
import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { log } from './logger.js';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../../');
const STANDALONE_SERVER = path.join(PROJECT_ROOT, '.next/standalone/server.js');

const APP_SERVER_PORT = 4100;

export class AppServer {
  url: string;
  port: number;
  private process: ChildProcess;

  private constructor(child: ChildProcess, port: number) {
    this.process = child;
    this.port = port;
    this.url = `http://localhost:${port}`;
  }

  static async start(databaseUrl: string): Promise<AppServer> {
    if (!fs.existsSync(STANDALONE_SERVER)) {
      throw new Error(
        `Next.js standalone build not found at ${STANDALONE_SERVER}. ` +
          `Run \`pnpm build\` first.`,
      );
    }
    AppServer.copyStaticAssets();

    const port = APP_SERVER_PORT;
    log('setup', `Starting app server on port ${port}...`);

    const child = spawn(process.execPath, [STANDALONE_SERVER], {
      cwd: path.join(PROJECT_ROOT, '.next/standalone'),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(port),
        HOSTNAME: '0.0.0.0',
        PUBLIC_URL: `http://localhost:${port}`,
        DATABASE_URL: databaseUrl,
        DATABASE_URL_UNPOOLED: databaseUrl,
        SKIP_ENV_VALIDATION: 'true',
        DISABLE_ANALYTICS: 'true',
        E2E_TEST: 'true',
        COOKIE_SECURE: 'false',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const server = new AppServer(child, port);

    child.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) log('info', `[app:stdout] ${msg}`);
    });
    child.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) log('info', `[app:stderr] ${msg}`);
    });

    await server.waitForReady();
    log('setup', `App server ready at ${server.url}`);
    return server;
  }

  private static copyStaticAssets(): void {
    const staticSrc = path.join(PROJECT_ROOT, '.next/static');
    const staticDest = path.join(PROJECT_ROOT, '.next/standalone/.next/static');
    if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
      execFileSync('cp', ['-r', staticSrc, staticDest], { stdio: 'pipe' });
    }
    const publicSrc = path.join(PROJECT_ROOT, 'public');
    const publicDest = path.join(PROJECT_ROOT, '.next/standalone/public');
    if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
      execFileSync('cp', ['-r', publicSrc, publicDest], { stdio: 'pipe' });
    }
    const cacheDir = path.join(PROJECT_ROOT, '.next/standalone/.next/cache');
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
  }

  private async waitForReady(timeoutMs = 30000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const response = await fetch(this.url, {
          redirect: 'manual',
          signal: AbortSignal.timeout(2000),
        });
        if (response.status > 0) return;
      } catch {
        // not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(
      `App server on port ${this.port} failed to start within ${timeoutMs}ms`,
    );
  }

  async stop(): Promise<void> {
    log('teardown', `Stopping app server on port ${this.port}...`);
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        this.process.kill('SIGKILL');
        resolve();
      }, 5000);
      this.process.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
      this.process.kill('SIGTERM');
    });
    log('teardown', `App server on port ${this.port} stopped`);
  }
}
