import { Protocol } from '@codaco/shared-consts';
import { ErrorObject } from 'ajv';
import schemas from '../schemas/compiled/index.js';

const getSchema = (version: number) =>
  schemas.find(({ version: _version }) => _version === version);

/**
 * Statically validate the protocol based on JSON schema
 */
const validateSchema = (protocol: Protocol, forceVersion?: number): Map<string, string> => {
  let version: number;
  const { schemaVersion } = protocol;

  // If forceVersion if provided, use that instead of the protocol's schemaVersion
  if (forceVersion) {
    console.log(`Forcing validation against schema version ${forceVersion}`);
    version = forceVersion;
  } else {
    if (typeof schemaVersion === 'string') {
      version = parseInt(schemaVersion, 10);
    } else {
      version = schemaVersion;
    }

    console.info(`Validating against schema version ${version}`);
  }

  const schema = getSchema(version);

  // Check resultant version exists
  if (!schema) {
    throw new Error(`Provided schema version '${version}' is not defined`);
  }

  // Validate
  const validator = schema.validator;
  const result = validator(protocol);
  if (!result && 'errors' in validator) {
    const errors = new Map();

    if (Array.isArray(validator.errors)) {
      // Iterate validator.errors and add each item into a Map
      validator.errors.forEach((error: ErrorObject) => {
        errors.set(error.schemaPath, error.message);
      });
    }

    return errors;
  }

  return new Map();

};

export default validateSchema;
