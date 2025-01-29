/**
 * Usage:
 * npm run validate-protocol [protocol-path]
 *
 * Errors & Validation failures are written to stderr.
 */
import chalk from 'chalk';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { ensureError } from '~/utils/ensureError';
import { getProtocolJson } from '~/utils/protocolImport';
import { validateProtocol } from '..';
import { Protocol } from '../schemas/src/8.zod';
import { errToString } from '../validation/helpers';

// eslint-disable-next-line no-console
const log = console.log;
const protocolArg = process.argv[2];
const forceSchemaArg = process.argv[3]
  ? parseInt(process.argv[3], 10)
  : undefined;

if (!protocolArg) {
  console.error('You must specify a protocol file to validate.');
  process.exit(1);
}

const protocolFilepath = protocolArg;
const protocolName = basename(protocolFilepath);

const logError = (msg: string) => log(chalk.red(msg));
const logSuccess = (msg: string) => log(chalk.green(msg));

export const validateJson = async (data: Protocol) => {
  try {
    const result = await validateProtocol(data, forceSchemaArg);

    if (result.isValid) {
      logSuccess(`${protocolName} is valid.`);
      return;
    }

    const { schemaErrors, logicErrors } = result;
    logError(`${protocolName} is NOT valid!`);
    if (schemaErrors.length) {
      logError(`${protocolName} has the following schema errors:`);
      schemaErrors.forEach((err) => logError(`\t- ${errToString(err)}`));
    }

    if (logicErrors.length) {
      console.error(`${protocolName} has the following logic errors:`);
      logicErrors.forEach((err) => logError(`\t- ${errToString(err)}`));
    }
  } catch (e: unknown) {
    const error = ensureError(e);
    logError('Validation failed.');
    logError(error.message);
  }
};

try {
  // Unzip the protocol file
  const protocolFile = await readFile(protocolFilepath);
  const zip = await JSZip.loadAsync(protocolFile);
  const protocolJson = await getProtocolJson(zip);
  await validateJson(protocolJson);
} catch (e) {
  const error = ensureError(e);
  logError(error.message);
  process.exit(1);
}
