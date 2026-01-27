import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { createPrismaClient } from '~/lib/db';
import { TestDataBuilder } from '../fixtures/test-data-builder';
import { AppEnvironment, type AppInstance } from './app-environment';
import { execFileAsync } from './execFileAsync';
import { logger } from './logger';

export type TestEnvironmentConfig = {
  /** Custom function to set up test data using Prisma client */
  setupData?: ({
    prisma,
    builder,
  }: {
    prisma: ReturnType<typeof createPrismaClient>;
    builder: TestDataBuilder;
  }) => Promise<void>;
};

class Environment {
  private suiteId: string;
  private appContext: AppInstance | null = null;
  private dbContainer: StartedPostgreSqlContainer | null = null;

  private nativeApp;
  private prismaClient: ReturnType<typeof createPrismaClient> | null = null;
  private dataBuilder: TestDataBuilder | null = null;
  private logger;

  constructor(suiteId: string) {
    this.suiteId = suiteId;
    this.logger = logger.environment(this.suiteId);
    this.nativeApp = new AppEnvironment(this.suiteId);
  }

  async initialise(config: TestEnvironmentConfig) {
    this.logger.creating();

    try {
      // Start PostgreSQL container (no network needed for native app)
      this.dbContainer = await this.startDatabase();

      // Get connection URL (directly accessible since not using Docker network)
      const databaseUrl = this.dbContainer.getConnectionUri();

      // Run Prisma migrations
      await this.runMigrations();

      this.prismaClient = createPrismaClient(databaseUrl);
      this.dataBuilder = new TestDataBuilder(this.prismaClient);

      await this.prismaClient.$connect();

      // Run custom setup data function if provided
      if (config.setupData) {
        await config.setupData({
          prisma: this.prismaClient,
          builder: this.dataBuilder,
        });
      }

      // Allocate port and start native Next.js process
      const appPort = AppEnvironment.allocatePort();

      this.appContext = await this.nativeApp.start({
        suiteId: this.suiteId,
        port: appPort,
        databaseUrl,
      });

      const variable = `${this.suiteId.toUpperCase()}_URL`;

      // Store URLs in environment variables for Playwright projects
      // eslint-disable-next-line no-process-env
      process.env[variable] = this.appContext.url;

      this.logger.ready(this.appContext.url);
    } catch (error) {
      this.logger.error(error);
      await this.cleanup();
      throw error;
    }
  }

  async createSnapshot(name?: string) {
    if (!this.dbContainer) {
      throw new Error('Database container not initialized');
    }

    await this.dbContainer.snapshot(name);
  }

  async restoreSnapshot(name?: string) {
    if (!this.dbContainer) {
      throw new Error('Database container not initialized');
    }

    await this.dbContainer.restoreSnapshot(name);
  }

  private async startDatabase(): Promise<StartedPostgreSqlContainer> {
    logger.database.starting();

    const container = await new PostgreSqlContainer(
      'postgres:16-alpine',
    ).start();

    const port = container.getMappedPort(5432);
    logger.database.started(port);
    logger.database.connectionInfo({
      host: 'localhost',
      port,
      username: container.getUsername(),
      database: container.getDatabase(),
      password: container.getPassword(),
      uri: container.getConnectionUri(),
    });

    return container;
  }

  /**
   * Run Prisma migrations for a database
   */
  private async runMigrations() {
    if (!this.suiteId || !this.dbContainer) {
      throw new Error('Environment not initialized');
    }

    this.logger.runningMigrations();

    try {
      await execFileAsync('pnpx', ['prisma', 'migrate', 'deploy'], {
        env: {
          // eslint-disable-next-line no-process-env
          ...process.env,
          DATABASE_URL: this.dbContainer.getConnectionUri(),
          DATABASE_URL_UNPOOLED: this.dbContainer.getConnectionUri(),
          SKIP_ENV_VALIDATION: 'true',
        },
      });
      this.logger.migrationsComplete();
    } catch (error) {
      this.logger.migrationsError(error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (!this.suiteId) {
      throw new Error('Environment not initialized');
    }

    this.logger.cleaning();

    try {
      await Promise.allSettled([
        this.prismaClient?.$disconnect(),
        this.nativeApp.stop(),
        this.dbContainer?.stop(),
      ]);
    } catch (error) {
      this.logger.cleanupError(error);
    }
  }
}

export default Environment;
