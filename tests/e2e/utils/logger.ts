import chalk from 'chalk';

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';

// Patterns to filter from container logs
const SUPPRESSED_PATTERNS = [
  /^\s*$/, // Empty lines
  /^migrations\//, // Migration tree output
  /^\s*└─/, // Tree branch characters
  /^┌─+┐/, // Box top
  /^│.*│$/, // Box content
  /^└─+┘/, // Box bottom
  /Update available/, // npm update notices
  /Run the following to update/, // Update instructions
  /npm i/, // npm commands
  /pris\.ly/, // Prisma links
  /This is a major update/, // Update warnings
];

// Patterns that indicate important messages to show
const IMPORTANT_PATTERNS = [
  { pattern: /Applying migration `(.+)`/, type: 'migration' as const },
  {
    pattern: /All migrations have been successfully applied/,
    type: 'success' as const,
  },
  { pattern: /Ready on/, type: 'ready' as const },
  { pattern: /error/i, type: 'error' as const },
  { pattern: /listening on/i, type: 'ready' as const },
  { pattern: /started/i, type: 'info' as const },
];

// Track migration state per suite
const migrationState = new Map<string, { count: number; names: string[] }>();

function shouldSuppressLog(message: string): boolean {
  return SUPPRESSED_PATTERNS.some((pattern) => pattern.test(message));
}

function getImportantLogType(
  message: string,
): 'migration' | 'success' | 'ready' | 'error' | 'info' | null {
  for (const { pattern, type } of IMPORTANT_PATTERNS) {
    if (pattern.test(message)) {
      return type;
    }
  }
  return null;
}

function extractMigrationName(message: string): string | null {
  const match = /Applying migration `(.+)`/.exec(message);
  return match?.[1] ?? null;
}

const icons = {
  info: '\u2139\uFE0F',
  success: '\u2705',
  warn: '\u26A0\uFE0F',
  error: '\u274C',
  debug: '\uD83D\uDD0D',
  build: '\uD83D\uDD28',
  docker: '\uD83D\uDC33',
  rocket: '\uD83D\uDE80',
  database: '\uD83D\uDCE6',
  seed: '\uD83C\uDF31',
  cleanup: '\uD83E\uDDF9',
  globe: '\uD83C\uDF0D',
  link: '\uD83D\uDD17',
  memo: '\uD83D\uDCDD',
};

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = chalk.gray(`[${new Date().toISOString().slice(11, 19)}]`);

  switch (level) {
    case 'info':
      return `${timestamp} ${chalk.blue(message)}`;
    case 'success':
      return `${timestamp} ${chalk.green(message)}`;
    case 'warn':
      return `${timestamp} ${chalk.yellow(message)}`;
    case 'error':
      return `${timestamp} ${chalk.red(message)}`;
    case 'debug':
      return `${timestamp} ${chalk.gray(message)}`;
    default:
      return `${timestamp} ${message}`;
  }
}

export const logger = {
  info: (message: string) => {
    process.stdout.write(formatMessage('info', message) + '\n');
  },

  success: (message: string) => {
    process.stdout.write(formatMessage('success', message) + '\n');
  },

  warn: (message: string) => {
    process.stdout.write(formatMessage('warn', message) + '\n');
  },

  error: (message: string, err?: unknown) => {
    process.stderr.write(formatMessage('error', message) + '\n');
    if (err) {
      const errorDetail =
        err instanceof Error
          ? (err.stack ?? err.message)
          : typeof err === 'string'
            ? err
            : JSON.stringify(err);
      process.stderr.write(chalk.red(errorDetail) + '\n');
    }
  },

  debug: (message: string) => {
    process.stdout.write(formatMessage('debug', message) + '\n');
  },

  // Specialized loggers for test setup
  setup: {
    start: () => {
      process.stdout.write('\n');
      logger.info(`${icons.globe} Running global setup for e2e tests...`);
      process.stdout.write('\n');
    },

    complete: () => {
      process.stdout.write('\n');
      logger.success(`${icons.success} All test environments ready!`);
      process.stdout.write('\n');
    },

    debugPause: () => {
      logger.debug(
        `${icons.debug} DEBUG_PAUSE is set. Containers are running.`,
      );
      logger.info(
        '   Press Enter to continue with tests (or Ctrl+C to exit)...',
      );
      process.stdout.write('\n');
    },
  },

  teardown: {
    start: () => {
      process.stdout.write('\n');
      logger.info(`${icons.cleanup} Running global teardown...`);
    },

    complete: () => {
      logger.success(`${icons.success} Teardown complete!`);
      process.stdout.write('\n');
    },
  },

  docker: {
    usingExisting: (imageName: string) => {
      logger.info(
        `${icons.docker} Using existing Docker image: ${chalk.cyan(imageName)}`,
      );
    },

    building: (imageName: string) => {
      logger.info(
        `${icons.build} Building Docker image: ${chalk.cyan(imageName)}`,
      );
    },

    buildSuccess: (imageName: string) => {
      logger.success(
        `${icons.success} Docker image built successfully: ${chalk.cyan(imageName)}`,
      );
      process.stdout.write('\n');
    },

    buildError: (error: unknown) => {
      logger.error('Failed to build Docker image:', error);
    },
  },

  environment: {
    creating: (suiteId: string) => {
      logger.info(
        `${icons.rocket} Creating test environment: ${chalk.cyan(suiteId)}`,
      );
    },

    ready: (suiteId: string, url: string) => {
      logger.success(`  ${chalk.cyan(suiteId)}: ${chalk.underline(url)}`);
    },

    error: (suiteId: string, error: unknown) => {
      logger.error(`Failed to create environment ${suiteId}:`, error);
    },

    cleaning: (suiteId: string) => {
      logger.info(
        `${icons.cleanup} Cleaning up environment: ${chalk.cyan(suiteId)}`,
      );
    },

    cleanupError: (suiteId: string, error: unknown) => {
      logger.error(`Error during cleanup of ${suiteId}:`, error);
    },
  },

  database: {
    starting: () => {
      logger.info(`  ${icons.database} Starting PostgreSQL...`);
    },

    started: (port: number) => {
      logger.success(
        `  ${icons.success} PostgreSQL started on port ${chalk.cyan(String(port))}`,
      );
    },

    connectionInfo: (options: {
      host: string;
      port: number;
      username: string;
      database: string;
      password: string;
      uri: string;
    }) => {
      logger.debug(
        `  ${icons.link} Connect with: ${chalk.gray(`psql -h ${options.host} -p ${options.port} -U ${options.username} -d ${options.database}`)}`,
      );
      logger.debug(`  ${icons.link} Password: ${chalk.gray(options.password)}`);
      logger.debug(
        `  ${icons.link} Connection URI: ${chalk.gray(options.uri)}`,
      );
    },

    urlInfo: (suiteId: string, url: string) => {
      logger.debug(
        `  ${icons.memo} Database URL for ${chalk.cyan(suiteId)}: ${chalk.gray(url)}`,
      );
    },
  },

  app: {
    starting: (suiteId: string) => {
      logger.info(
        `  ${icons.rocket} Starting application for ${chalk.cyan(suiteId)}...`,
      );
      // Reset migration state for this suite
      migrationState.set(suiteId, { count: 0, names: [] });
    },

    started: (port: number) => {
      logger.success(
        `  ${icons.success} Application started on port ${chalk.cyan(String(port))}`,
      );
    },

    log: (suiteId: string, message: string) => {
      const trimmed = message.trim();

      // Skip suppressed patterns
      if (shouldSuppressLog(trimmed)) {
        return;
      }

      const logType = getImportantLogType(trimmed);

      if (logType === 'migration') {
        // Track migrations and show condensed output
        const migrationName = extractMigrationName(trimmed);
        const state = migrationState.get(suiteId) ?? { count: 0, names: [] };

        if (migrationName) {
          state.count++;
          state.names.push(migrationName);
          migrationState.set(suiteId, state);

          // Show first migration with info about total
          if (state.count === 1) {
            process.stdout.write(
              chalk.gray(`    [${suiteId}] `) +
                chalk.blue(`${icons.database} Applying migrations...`) +
                '\n',
            );
          }
        }
        return;
      }

      if (logType === 'success') {
        const state = migrationState.get(suiteId);
        if (state && state.count > 0) {
          process.stdout.write(
            chalk.gray(`    [${suiteId}] `) +
              chalk.green(
                `${icons.success} ${state.count} migrations applied successfully`,
              ) +
              '\n',
          );
          migrationState.delete(suiteId);
        }
        return;
      }

      if (logType === 'ready') {
        process.stdout.write(
          chalk.gray(`    [${suiteId}] `) +
            chalk.green(`${icons.success} ${trimmed}`) +
            '\n',
        );
        return;
      }

      if (logType === 'error') {
        process.stderr.write(
          chalk.gray(`    [${suiteId}] `) + chalk.red(trimmed) + '\n',
        );
        return;
      }

      // For other important messages, show them in gray
      if (logType === 'info') {
        process.stdout.write(chalk.gray(`    [${suiteId}] ${trimmed}`) + '\n');
      }
      // All other messages are suppressed for cleaner output
    },

    errorLog: (suiteId: string, message: string) => {
      const trimmed = message.trim();
      if (trimmed) {
        process.stderr.write(
          chalk.gray(`    [${suiteId}] `) +
            chalk.red(`${icons.error} ${trimmed}`) +
            '\n',
        );
      }
    },

    startError: (suiteId: string, err: unknown) => {
      logger.error(`  ${icons.error} Container failed to start for ${suiteId}`);
      if (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : JSON.stringify(err);
        logger.error(`  Error: ${errorMessage}`);
      }
    },
  },

  seed: {
    running: (scriptName: string) => {
      logger.info(
        `  ${icons.seed} Running seed script: ${chalk.cyan(scriptName)}`,
      );
    },

    applied: (scriptName: string) => {
      logger.success(
        `    ${chalk.green('\u2713')} Applied seed: ${chalk.cyan(scriptName)}`,
      );
    },

    complete: () => {
      logger.success(`${icons.success} Seed data created`);
    },
  },
};
