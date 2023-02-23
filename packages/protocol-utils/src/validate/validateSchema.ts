import { Protocol } from '@codaco/shared-consts';
import schemas from '../schemas/compiled/index.js';

const getSchema = (version: number) =>
  schemas.find(({ version: _version }) => _version === version);

/**
 * Statically validate the protocol based on JSON schema
 */
const validateSchema = (protocol: Protocol, forceVersion?: number) => {
  let version: number;
  let { schemaVersion } = protocol;

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
  }

  const schema = getSchema(version);

  // Check resultant version exists
  if (!schema) {
    return [new Error(`Provided schema version '${version}' is not defined`)];
  }

  // Validate
  const validator = schema.validator;
  const result = validator(protocol);
  if (!result) {
    // @ts-ignore
    return validator.errors;
  };

  return [];

};

export default validateSchema;
