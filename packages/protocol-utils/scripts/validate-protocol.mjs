import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { ValidationError, validateProtocol, errToString } from '../dist/index.js';
import chalk from 'chalk';

/**
 * Usage:
 * npm run validate-protocol [protocol-path]
 *
 * Errors & Validation failures are written to stderr.
 */


const protocolArg = process.argv[2];
const forceSchemaArg = process.argv[3];

if (!protocolArg) {
  console.error(chalk.red('You must specify a protocol file to validate.'));
  process.exit(1);
}

const protocolFilepath = protocolArg;
const protocolName = basename(protocolFilepath);
const exitOnValidationFailure = !!process.env.CI;


const validateJson = (jsonString) => {
  try {
    validateProtocol(jsonString, forceSchemaArg); // Throws ValidationError if invalid
    console.log(chalk.green(`${protocolName} is valid.`));
  } catch (err) {
    // Test for our custom ValidationError
    if (err instanceof ValidationError) {
      console.log(chalk.red(`${protocolName} is NOT valid!`));

      // TODO: Format this as a tree structure for better readability

      if (err.dataErrors.size > 0) {
        console.log('Data Errors:');
        err.dataErrors.forEach((err, key) => console.warn(`- ${key}: ${errToString(err)}`));
      }

      if (err.schemaErrors.size > 0) {
        console.log('Schema Errors:');
        err.schemaErrors.forEach((err, key) => console.warn(`- ${key}: ${errToString(err)}`));
      }
      return;
    }

    // Otherwise, it's an internal error
    console.error(chalk.red('There was an internal error while validating the protocol.'));
    console.error(err);

    if (exitOnValidationFailure) {
      process.exit(1);
    }
  }
};

let protocolContents;

try {
  protocolContents = await readFile(protocolFilepath, { encoding: 'utf8' });
} catch (err) {
  console.error(err);
  process.exit(1);
}

validateJson(protocolContents);
