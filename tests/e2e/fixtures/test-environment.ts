import { type PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  GenericContainer,
  Network,
  Wait,
  type StartedNetwork,
  type StartedTestContainer,
} from 'testcontainers';
import { fileURLToPath } from 'url';
import { TEST_ENVIRONMENT, TEST_TIMEOUTS } from '../config/test-config';

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
  appContainer: StartedTestContainer;
  dbContainer: StartedPostgreSqlContainer;
  prisma: PrismaClient;
  network: StartedNetwork;
  createSnapshot: (name?: string) => Promise<void>;
  restoreSnapshot: (name?: string) => Promise<void>;
  cleanup: () => Promise<void>;
};

export class TestEnvironment {
  private contexts = new Map<string, TestEnvironmentContext>();

  async create(config: TestEnvironmentConfig): Promise<TestEnvironmentContext> {
    // eslint-disable-next-line no-console
    console.log(`🚀 Creating test environment: ${config.suiteId}`);

    try {
      // Create network for this environment
      const network = await new Network().start();

      // Start PostgreSQL container
      const dbContainer = await this.startDatabase(network);

      // Build and start application container
      const appContainer = await this.startApplication({
        ...config,
        dbContainer,
        network,
      });

      // Initialize Prisma client
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: dbContainer.getConnectionUri(),
          },
        },
      });

      await prisma.$connect();

      // Run seed script if provided
      if (config.seedScript) {
        await this.runSeedScript(config.seedScript, prisma);
      }

      // Run custom setup data function if provided
      if (config.setupData) {
        await config.setupData(prisma);
      }

      const appPort = appContainer.getMappedPort(3000);
      const appUrl = `http://localhost:${appPort}`;

      const context: TestEnvironmentContext = {
        appUrl,
        appContainer,
        dbContainer,
        prisma,
        network,
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
      process.env[variable] = appUrl;

      // eslint-disable-next-line no-console
      console.log(`  ${config.suiteId}:        ${appUrl}`);
      return context;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to create environment ${config.suiteId}:`, error);
      await this.cleanup(config.suiteId);
      throw error;
    }
  }

  private async startDatabase(
    network: StartedNetwork,
  ): Promise<StartedPostgreSqlContainer> {
    // eslint-disable-next-line no-console
    console.log(`  📦 Starting PostgreSQL...`);

    const container = await new PostgreSqlContainer('postgres:16-alpine')
      .withNetwork(network)
      .withNetworkAliases('postgres-db')
      .start();

    const port = container.getMappedPort(5432);
    // eslint-disable-next-line no-console
    console.log(`  ✅ PostgreSQL started on port ${port}`);
    // eslint-disable-next-line no-console
    console.log(
      `  🔗 Connect with: psql -h localhost -p ${port} -U ${container.getUsername()} -d ${container.getDatabase()}`,
    );
    // eslint-disable-next-line no-console
    console.log(`  🔗 Password: ${container.getPassword()}`);
    // eslint-disable-next-line no-console
    console.log(`  🔗 Connection URI: ${container.getConnectionUri()}`);
    return container;
  }

  private async runSeedScript(
    seedScript: string,
    prisma: PrismaClient,
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`  🌱 Running seed script: ${seedScript}`);

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

    // eslint-disable-next-line no-console
    console.log(`    ✓ Applied seed: ${seedScript}`);
  }

  private async startApplication(
    config: TestEnvironmentConfig & {
      dbContainer: StartedPostgreSqlContainer;
      network: StartedNetwork;
    },
  ): Promise<StartedTestContainer> {
    // eslint-disable-next-line no-console
    console.log(`  🚀 Starting application for ${config.suiteId}...`);

    // Assume image is already built (e.g., in CI pipeline)
    // eslint-disable-next-line no-process-env
    const imageName = process.env.TEST_IMAGE_NAME!;

    const databaseUrl = `postgresql://${config.dbContainer.getUsername()}:${config.dbContainer.getPassword()}@postgres-db:5432/${config.dbContainer.getDatabase()}`;

    // eslint-disable-next-line no-console
    console.log(`  📝 Database URL for ${config.suiteId}: ${databaseUrl}`);

    let container: StartedTestContainer;
    try {
      container = await new GenericContainer(imageName)
        .withEnvironment({
          NODE_ENV: 'test',
          DATABASE_URL: databaseUrl,
          DATABASE_URL_UNPOOLED: databaseUrl,
          SKIP_ENV_VALIDATION: TEST_ENVIRONMENT.skipEnvValidation
            ? 'true'
            : 'false',
          HOSTNAME: '0.0.0.0',
          PORT: '3000',
          // Add a test UploadThing token for onboarding flow
          UPLOADTHING_TOKEN: TEST_ENVIRONMENT.uploadThingToken,
        })
        .withExposedPorts(3000)
        .withNetwork(config.network)
        .withNetworkAliases('app')
        .withLogConsumer((stream) => {
          stream.on('data', (line) => {
            // eslint-disable-next-line no-console
            console.log(`  [${config.suiteId}] ${line}`);
          });
          stream.on('err', (line) => {
            // eslint-disable-next-line no-console
            console.error(`  [${config.suiteId}] ERR: ${line}`);
          });
        })
        .withWaitStrategy(
          Wait.forListeningPorts().withStartupTimeout(
            TEST_TIMEOUTS.containerStartup,
          ),
        )
        .start();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`  ❌ Container failed to start for ${config.suiteId}`);
      // eslint-disable-next-line no-console
      console.error('  Error:', error);
      throw error;
    }

    // eslint-disable-next-line no-console
    console.log(
      `  ✅ Application started on port ${container.getMappedPort(3000)}`,
    );

    // Wait a bit for the Next.js app to fully initialize
    await new Promise((resolve) =>
      setTimeout(resolve, TEST_TIMEOUTS.appInitialization),
    );

    return container;
  }

  private async startFromDockerfile(
    config: TestEnvironmentConfig & {
      dbContainer: StartedPostgreSqlContainer;
      network: StartedNetwork;
    },
  ): Promise<StartedTestContainer> {
    // Use the pre-built image set by global setup
    // eslint-disable-next-line no-process-env
    const imageName = process.env.TEST_IMAGE_NAME ?? 'fresco-test:latest';

    const databaseUrl = `postgresql://${config.dbContainer.getUsername()}:${config.dbContainer.getPassword()}@postgres-db:5432/${config.dbContainer.getDatabase()}`;

    const container = await new GenericContainer(imageName)
      .withEnvironment({
        NODE_ENV: 'test',
        DATABASE_URL: databaseUrl,
        DATABASE_URL_UNPOOLED: databaseUrl,
        SKIP_ENV_VALIDATION: TEST_ENVIRONMENT.skipEnvValidation
          ? 'true'
          : 'false',
        HOSTNAME: '0.0.0.0',
        PORT: '3000',
        // Add a test UploadThing token for onboarding flow
        UPLOADTHING_TOKEN: TEST_ENVIRONMENT.uploadThingToken,
      })
      .withExposedPorts(3000)
      .withNetwork(config.network)
      .withNetworkAliases('app')
      .withWaitStrategy(
        Wait.forListeningPorts().withStartupTimeout(
          TEST_TIMEOUTS.containerStartup,
        ),
      )
      .start();

    // eslint-disable-next-line no-console
    console.log(
      `  ✅ Application started on port ${container.getMappedPort(3000)}`,
    );

    // Wait a bit for the Next.js app to fully initialize
    await new Promise((resolve) =>
      setTimeout(resolve, TEST_TIMEOUTS.appInitialization),
    );

    return container;
  }

  async cleanup(suiteId: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`🧹 Cleaning up environment: ${suiteId}`);

    const context = this.contexts.get(suiteId);
    if (!context) return;

    try {
      await Promise.allSettled([
        context.prisma.$disconnect(),
        context.appContainer?.stop(),
        context.dbContainer?.stop(),
        context.network?.stop(),
      ]);

      this.contexts.delete(suiteId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error during cleanup of ${suiteId}:`, error);
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
}
