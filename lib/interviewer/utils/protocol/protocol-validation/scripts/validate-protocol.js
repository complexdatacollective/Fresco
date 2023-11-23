/* eslint-env node */
/* eslint-disable no-console */

/**
 * Usage:
 * npm run validate-protocol [protocol-path]
 *
 * Errors & Validation failures are written to stderr.
 */
const Chalk = require('chalk').constructor;
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const { validateSchema, validateLogic } = require('../validation');
const { errToString } = require('../validation/helpers');

const protocolArg = process.argv[2];
const forceSchemaArg = process.argv[3];

if (!protocolArg) {
  console.error('You must specify a protocol file to validate.');
  process.exit(1);
}

const protocolFilepath = protocolArg;
const protocolName = path.basename(protocolFilepath);
const exitOnValidationFailure = !!process.env.CI;

let protocolContents;

let data;

const chalk = new Chalk({ enabled: !!process.stderr.isTTY });

const extractProtocolSource = async (zippedProtocol) => {
  const zip = new JSZip();
  const zipObject = await zip.loadAsync(zippedProtocol);
  const contents = await zipObject.file('protocol.json').async('string');
  return contents;
};

const validateJson = (jsonString) => {
  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    console.error(chalk.red('Invalid protocol file'));
    console.error(e);
    process.exit(1);
  }

  const schemaErrors = validateSchema(data, forceSchemaArg);
  const dataErrors = validateLogic(data);
  const isValid = !schemaErrors.length && !dataErrors.length;

  if (isValid) {
    console.log(chalk.green(`${protocolName} is valid.`));
  } else {
    console.log(chalk.red(`${protocolName} is NOT valid!`));
    if (schemaErrors.length) {
      console.error(`${protocolName} has the following schema errors:`);
      schemaErrors.forEach(err => console.warn('-', errToString(err)));
    }

    if (dataErrors.length) {
      console.error(`${protocolName} has the following data errors:`);
      dataErrors.forEach(err => console.warn('-', errToString(err)));
    }

    if (exitOnValidationFailure) {
      process.exit(1);
    }
  }
};

try {
  protocolContents = fs.readFileSync(protocolFilepath);
} catch (err) {
  console.error(err);
  process.exit(1);
}

if (protocolFilepath.match(/\.netcanvas$/)) {
  extractProtocolSource(protocolContents)
    .then(jsonString => validateJson(jsonString));
} else {
  validateJson(fs.readFileSync(protocolFilepath));
}
