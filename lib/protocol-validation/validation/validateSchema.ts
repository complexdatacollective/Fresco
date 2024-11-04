import { Protocol } from "@codaco/shared-consts";
import type { ValidateFunction } from "ajv";
import { ValidationError } from "..";

export const validateSchema = async (
  protocol: Protocol,
  forceVersion?: number,
) => {
  if (!protocol) {
    throw new Error("Protocol is undefined");
  }

  const version = forceVersion || protocol.schemaVersion || null;

  if (!version) {
    throw new Error(
      "Protocol does not have a schema version, and force version was not used.",
    );
  }

  if (forceVersion) {
    console.log(`Forcing validation against schema version ${version}...`);
  }

  let validator: ValidateFunction;

  try {
    validator = await import(`./schemas/${version}.js`).then(
      (module) => module.default,
    );
  } catch (e) {
    throw new Error(`Couldn't find validator for schema version ${version}.`);
  }

  // Validate
  if (!validator(protocol)) {
    // If we get here, validator has validator.errors.
    const errorMessages = validator.errors!.map((error) => {
      return {
        path: error.instancePath,
        message: error.message,
      } as ValidationError;
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
