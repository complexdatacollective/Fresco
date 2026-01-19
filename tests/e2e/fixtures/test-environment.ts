import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PrismaClient } from '~/lib/db/generated/client';
import { logger } from '../utils/logger';
import {
  NativeAppEnvironment,
  type NativeAppContext,
} from './native-app-environment';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type TestEnvironmentConfig = {
  /** Unique identifier for this test suite environment */
  suiteId: string;
  /** Optional SQL or TypeScript file to run for seeding test data */
  seedScript?: string;
  /** Custom function to set up test data using Prisma client */
  setupData?: (prisma: PrismaClient) => Promise<void>;
};

export type TestEnvironmentContext = {
  appUrl: string;
  appContext: NativeAppContext;
  dbContainer: StartedPostgreSqlContainer;
  prisma: PrismaClient;
  createSnapshot: (name?: string) => Promise<void>;
  restoreSnapshot: (name?: string) => Promise<void>;
  cleanup: () => Promise<void>;
};

export class TestEnvironment {
  private contexts = new Map<string, TestEnvironmentContext>();
  private nativeApp = new NativeAppEnvironment();

  async create(config: TestEnvironmentConfig): Promise<TestEnvironmentContext> {
    logger.environment.creating(config.suiteId);

    try {
      // Start PostgreSQL container (no network needed for native app)
      const dbContainer = await this.startDatabase();

      // Get connection URL (directly accessible since not using Docker network)
      const databaseUrl = dbContainer.getConnectionUri();

      // Run Prisma migrations
      await this.nativeApp.runMigrations(databaseUrl, config.suiteId);

      // Initialize Prisma client
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const { PrismaClient: GeneratedPrismaClient } =
        await import('~/lib/db/generated/client');
      const adapter = new PrismaPg({
        connectionString: databaseUrl,
      });
      const prisma = new GeneratedPrismaClient({ adapter }) as PrismaClient;

      await prisma.$connect();

      // Run seed script if provided
      if (config.seedScript) {
        await this.runSeedScript(config.seedScript, prisma);
      }

      // Run custom setup data function if provided
      if (config.setupData) {
        await config.setupData(prisma);
      }

      // Allocate port and start native Next.js process
      const port = NativeAppEnvironment.allocatePort();
      const appContext = await this.nativeApp.start({
        suiteId: config.suiteId,
        port,
        databaseUrl,
      });

      const context: TestEnvironmentContext = {
        appUrl: appContext.url,
        appContext,
        dbContainer,
        prisma,
        createSnapshot: async (name?: string) => {
          await dbContainer.snapshot(name);
        },
        restoreSnapshot: async (name?: string) => {
          await dbContainer.restoreSnapshot(name);
        },
        cleanup: async () => {
          await this.cleanup(config.suiteId);
        },
      };

      this.contexts.set(config.suiteId, context);

      const variable = `${config.suiteId.toUpperCase()}_URL`;

      // Store URLs in environment variables for Playwright projects
      // eslint-disable-next-line no-process-env
      process.env[variable] = appContext.url;

      logger.environment.ready(config.suiteId, appContext.url);
      return context;
    } catch (error) {
      logger.environment.error(config.suiteId, error);
      await this.cleanup(config.suiteId);
      throw error;
    }
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

  private async runSeedScript(
    seedScript: string,
    prisma: PrismaClient,
  ): Promise<void> {
    logger.seed.running(seedScript);

    const seedPath = path.join(__dirname, '../seeds', seedScript);

    // Check if it's a SQL file or a TypeScript file
    if (seedScript.endsWith('.sql')) {
      const seedContent = await fs.readFile(seedPath, 'utf-8');
      // Execute raw SQL
      await prisma.$executeRawUnsafe(seedContent);
    } else if (seedScript.endsWith('.ts')) {
      // Dynamic import of TypeScript seed file
      const seedModule = (await import(seedPath)) as {
        default: (prisma: PrismaClient) => Promise<void>;
      };
      if (typeof seedModule.default === 'function') {
        await seedModule.default(prisma);
      } else {
        throw new Error(
          `Seed script ${seedScript} does not export a default function`,
        );
      }
    }

    logger.seed.applied(seedScript);
  }

  async cleanup(suiteId: string): Promise<void> {
    logger.environment.cleaning(suiteId);

    const context = this.contexts.get(suiteId);
    if (!context) return;

    try {
      await Promise.allSettled([
        context.prisma.$disconnect(),
        this.nativeApp.stop(suiteId),
        context.dbContainer?.stop(),
      ]);

      this.contexts.delete(suiteId);
    } catch (error) {
      logger.environment.cleanupError(suiteId, error);
    }
  }

  async cleanupAll(): Promise<void> {
    const cleanupPromises = Array.from(this.contexts.keys()).map((suiteId) =>
      this.cleanup(suiteId),
    );
    await Promise.all(cleanupPromises);
  }

  getContext(suiteId: string): TestEnvironmentContext | undefined {
    return this.contexts.get(suiteId);
  }

  getNativeAppEnvironment(): NativeAppEnvironment {
    return this.nativeApp;
  }
}
