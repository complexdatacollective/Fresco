/* eslint-disable no-console */
import type { ValidateFunction } from 'ajv';
import { Protocol } from '../schemas/src/8.zod';

export const validateSchema = async (
  protocol: Protocol,
  forceVersion?: number,
) => {
  if (!protocol) {
    throw new Error('Protocol is undefined');
  }

  const version = (forceVersion ?? protocol.schemaVersion) || null;

  if (!version) {
    throw new Error(
      'Protocol does not have a schema version, and force version was not used.',
    );
  }

  if (forceVersion) {
    console.log(`Forcing validation against schema version ${version}...`);
  }

  let validator: ValidateFunction;

  try {
    const result = (await import(
      `~/lib/protocol-validation/schemas/compiled/${version}.js`
    )) as { default: ValidateFunction };

    validator = result.default;
  } catch (e) {
    throw new Error(`Couldn't find validator for schema version ${version}.`);
  }

  const result = validator(protocol);

  // Validate
  if (!result) {
    // If we get here, validator has validator.errors.
    const errorMessages = validator.errors!.map((error) => {
      return {
        path: error.instancePath,
        message: error.message,
      };
    });

    return {
      hasErrors: true,
      errors: errorMessages,
    };
  }

  return {
    hasErrors: false,
    errors: [],
  };
};
