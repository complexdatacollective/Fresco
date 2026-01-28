/* eslint-disable no-console */
import chalk from 'chalk';

type LogPhase = 'setup' | 'teardown' | 'test' | 'info';

const phaseColors: Record<LogPhase, (text: string) => string> = {
  setup: chalk.cyan,
  teardown: chalk.yellow,
  test: chalk.green,
  info: chalk.blue,
};

export function log(
  phase: LogPhase,
  message: string,
  ...args: unknown[]
): void {
  const prefix = phaseColors[phase](`[${phase.toUpperCase()}]`);
  const timestamp = chalk.gray(
    new Date().toISOString().split('T')[1]?.slice(0, 12),
  );
  console.log(`${timestamp} ${prefix} ${message}`, ...args);
}

export function logError(
  phase: LogPhase,
  message: string,
  error?: unknown,
): void {
  const prefix = phaseColors[phase](`[${phase.toUpperCase()}]`);
  const timestamp = chalk.gray(
    new Date().toISOString().split('T')[1]?.slice(0, 12),
  );
  console.error(`${timestamp} ${prefix} ${chalk.red(message)}`);
  if (error instanceof Error) {
    console.error(chalk.red(`  ${error.message}`));
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
  }
}
