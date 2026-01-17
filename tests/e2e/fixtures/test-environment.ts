import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GenericContainer,
  Network,
  type StartedNetwork,
  type StartedTestContainer,
  Wait,
} from "testcontainers";
import type { PrismaClient } from "~/lib/db/generated/client";
import { TEST_ENVIRONMENT, TEST_TIMEOUTS } from "../config/test-config";
import { logger } from "../utils/logger";

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
		logger.environment.creating(config.suiteId);

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
			const { PrismaPg } = await import("@prisma/adapter-pg");
			const { PrismaClient: GeneratedPrismaClient } = await import(
				"~/lib/db/generated/client"
			);
			const adapter = new PrismaPg({
				connectionString: dbContainer.getConnectionUri(),
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

			logger.environment.ready(config.suiteId, appUrl);
			return context;
		} catch (error) {
			logger.environment.error(config.suiteId, error);
			await this.cleanup(config.suiteId);
			throw error;
		}
	}

	private async startDatabase(
		network: StartedNetwork,
	): Promise<StartedPostgreSqlContainer> {
		logger.database.starting();

		const container = await new PostgreSqlContainer("postgres:16-alpine")
			.withNetwork(network)
			.withNetworkAliases("postgres-db")
			.start();

		const port = container.getMappedPort(5432);
		logger.database.started(port);
		logger.database.connectionInfo({
			host: "localhost",
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

		const seedPath = path.join(__dirname, "../seeds", seedScript);

		// Check if it's a SQL file or a TypeScript file
		if (seedScript.endsWith(".sql")) {
			const seedContent = await fs.readFile(seedPath, "utf-8");
			// Execute raw SQL
			await prisma.$executeRawUnsafe(seedContent);
		} else if (seedScript.endsWith(".ts")) {
			// Dynamic import of TypeScript seed file
			const seedModule = (await import(seedPath)) as {
				default: (prisma: PrismaClient) => Promise<void>;
			};
			if (typeof seedModule.default === "function") {
				await seedModule.default(prisma);
			} else {
				throw new Error(
					`Seed script ${seedScript} does not export a default function`,
				);
			}
		}

		logger.seed.applied(seedScript);
	}

	private async startApplication(
		config: TestEnvironmentConfig & {
			dbContainer: StartedPostgreSqlContainer;
			network: StartedNetwork;
		},
	): Promise<StartedTestContainer> {
		logger.app.starting(config.suiteId);

		// Assume image is already built (e.g., in CI pipeline)
		// eslint-disable-next-line no-process-env
		const imageName = process.env.TEST_IMAGE_NAME!;

		const databaseUrl = `postgresql://${config.dbContainer.getUsername()}:${config.dbContainer.getPassword()}@postgres-db:5432/${config.dbContainer.getDatabase()}`;

		logger.database.urlInfo(config.suiteId, databaseUrl);

		let container: StartedTestContainer;
		try {
			container = await new GenericContainer(imageName)
				.withEnvironment({
					NODE_ENV: "test",
					DATABASE_URL: databaseUrl,
					DATABASE_URL_UNPOOLED: databaseUrl,
					SKIP_ENV_VALIDATION: TEST_ENVIRONMENT.skipEnvValidation
						? "true"
						: "false",
					HOSTNAME: "0.0.0.0",
					PORT: "3000",
					// Add a test UploadThing token for onboarding flow
					UPLOADTHING_TOKEN: TEST_ENVIRONMENT.uploadThingToken,
				})
				.withExposedPorts(3000)
				.withNetwork(config.network)
				.withNetworkAliases("app")
				.withLogConsumer((stream) => {
					stream.on("data", (line: string | Buffer) => {
						// Skip if line is null/undefined
						if (line == null) return;
						const lineStr =
							typeof line === "string" ? line : line.toString("utf-8");
						logger.app.log(config.suiteId, lineStr);
					});
					stream.on("err", (line: string | Buffer) => {
						// Skip if line is null/undefined
						if (line == null) return;
						const lineStr =
							typeof line === "string" ? line : line.toString("utf-8");
						logger.app.errorLog(config.suiteId, lineStr);
					});
					stream.on("error", (err) => {
						// Handle stream errors (different from container stderr)
						if (err) {
							const errMsg = err instanceof Error ? err.message : String(err);
							logger.app.errorLog(config.suiteId, `Stream error: ${errMsg}`);
						}
					});
				})
				.withWaitStrategy(
					Wait.forListeningPorts().withStartupTimeout(
						TEST_TIMEOUTS.containerStartup,
					),
				)
				.start();
		} catch (error) {
			logger.app.startError(config.suiteId, error);
			throw error;
		}

		logger.app.started(container.getMappedPort(3000));

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
		const imageName = process.env.TEST_IMAGE_NAME ?? "fresco-test:latest";

		const databaseUrl = `postgresql://${config.dbContainer.getUsername()}:${config.dbContainer.getPassword()}@postgres-db:5432/${config.dbContainer.getDatabase()}`;

		const container = await new GenericContainer(imageName)
			.withEnvironment({
				NODE_ENV: "test",
				DATABASE_URL: databaseUrl,
				DATABASE_URL_UNPOOLED: databaseUrl,
				SKIP_ENV_VALIDATION: TEST_ENVIRONMENT.skipEnvValidation
					? "true"
					: "false",
				HOSTNAME: "0.0.0.0",
				PORT: "3000",
				// Add a test UploadThing token for onboarding flow
				UPLOADTHING_TOKEN: TEST_ENVIRONMENT.uploadThingToken,
			})
			.withExposedPorts(3000)
			.withNetwork(config.network)
			.withNetworkAliases("app")
			.withWaitStrategy(
				Wait.forListeningPorts().withStartupTimeout(
					TEST_TIMEOUTS.containerStartup,
				),
			)
			.start();

		logger.app.started(container.getMappedPort(3000));

		// Wait a bit for the Next.js app to fully initialize
		await new Promise((resolve) =>
			setTimeout(resolve, TEST_TIMEOUTS.appInitialization),
		);

		return container;
	}

	async cleanup(suiteId: string): Promise<void> {
		logger.environment.cleaning(suiteId);

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
}
