import schemas from '~/lib/protocol-utils/schemas/compiled';
import type { Protocol } from '~/lib/shared-consts';

const getSchema = (version: number) =>
  schemas.find(({ version: _version }) => _version === version);

/**
 * Statically validate the protocol based on JSON schema
 */
const validateSchema = (
  protocol: Protocol,
  forceVersion: number,
): Array<string> => {
  const version = forceVersion || protocol.schemaVersion;

  if (forceVersion) {
    // eslint-disable-next-line no-console
    console.info(`Forcing validation against schema version ${version}`);
  }

  const schema = getSchema(version);

  // Check resultant version exists
  if (!schema) {
    throw new Error(`Provided schema version '${version}' is not defined`);
  }

  // Validate
  type ValidationErrors = {
    errors: Array<string>;
  };

  const validator = schema.validator;
  validator(protocol) as boolean | ValidationErrors;
  if (validator.errors) {
    // eslint-disable-next-line no-console
    console.info('Schema validation errors:', validator.errors);
    return validator.errors;
  }

  return [];
};

export default validateSchema;
