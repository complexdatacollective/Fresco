/* eslint-disable no-console */

/**
 * Usage:
 * npm run validate-protocol [protocol-path]
 *
 * Errors & Validation failures are written to stderr.
 */
import chalk from "chalk";
import { basename } from "node:path";
import { errToString } from "../src/validation/helpers";
import { ValidationError, validateProtocol } from "../dist";
import { Protocol } from "@codaco/shared-consts";

const protocolArg = process.argv[2];
const forceSchemaArg = process.argv[3];

if (!protocolArg) {
  console.error("You must specify a protocol file to validate.");
  process.exit(1);
}

const protocolFilepath = protocolArg;
const protocolName = basename(protocolFilepath);

const log = console.log;

const error = (msg: string) => log(chalk.red(msg));
const success = (msg: string) => log(chalk.green(msg));

export const validateJson = async (data: Protocol) => {
  try {
    await validateProtocol(data, parseInt(forceSchemaArg));
    success(`${protocolName} is valid.`);
  } catch (e: unknown) {
    // Validation errors
    if (e instanceof ValidationError) {
      const { schemaErrors, logicErrors } = e;
      error(`${protocolName} is NOT valid!`);
      if (schemaErrors.length) {
        console.error(`${protocolName} has the following schema errors:`);
        schemaErrors.forEach((err) => error(`\t- ${errToString(err)}`));
      }

      if (logicErrors.length) {
        console.error(`${protocolName} has the following logic errors:`);
        logicErrors.forEach((err) => error(`\t- ${errToString(err)}`));
      }
    }

    // Internal errors
    if (e instanceof Error) {
      error("Validation failed.");
      error(e.message);
    }
  }
};

try {
  const file = await Bun.file(protocolFilepath).json();
  await validateJson(file);
} catch (err) {
  console.error(err);
  process.exit(1);
}
