import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { log } from './logger.js';

export class TestDatabase {
  private container: StartedPostgreSqlContainer;
  connectionUri: string;

  private constructor(
    container: StartedPostgreSqlContainer,
    connectionUri: string,
  ) {
    this.container = container;
    this.connectionUri = connectionUri;
  }

  static async start(): Promise<TestDatabase> {
    log('setup', 'Starting PostgreSQL container...');
    const container = await new PostgreSqlContainer('postgres:17-alpine')
      .withDatabase('fresco_test')
      .withUsername('test')
      .withPassword('test')
      .start();
    const connectionUri = container.getConnectionUri();
    log('setup', `PostgreSQL started at ${connectionUri}`);
    return new TestDatabase(container, connectionUri);
  }

  runMigrations(): void {
    log('setup', 'Running Prisma migrations...');
    const projectRoot = path.resolve(import.meta.dirname, '../../../');
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: projectRoot,
      env: {
        // eslint-disable-next-line no-process-env
        ...process.env,
        DATABASE_URL: this.connectionUri,
        DATABASE_URL_UNPOOLED: this.connectionUri,
        SKIP_ENV_VALIDATION: 'true',
      },
      stdio: 'pipe',
    });
    log('setup', 'Migrations completed');
  }

  async stop(): Promise<void> {
    log('teardown', 'Stopping PostgreSQL container...');
    await this.container.stop();
    log('teardown', 'PostgreSQL container stopped');
  }
}
