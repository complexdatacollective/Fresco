import validateSchema from "./validateSchema.js";
import validateLogic from "./validateLogic.js";

export class ValidationError extends Error {
  constructor(message: string, public schemaErrors: Map<string, string>, public dataErrors: Map<string, string>) {
    super(message); // (1)
    this.name = "ValidationError"; // (2)
    this.schemaErrors = schemaErrors;
    this.dataErrors = dataErrors;
  }
}

export type ValidateProtocolReturn = void | ValidationError;

export const validateProtocol = (jsonString: string, forceVersion?: number): ValidateProtocolReturn => {
  let data;

  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Invalid JSON file');
  }

  let schemaErrors;
  let dataErrors;
  let isValid = false;

  try {
    schemaErrors = <Map<string, string>>validateSchema(data, forceVersion)
    dataErrors = <Map<string, string>>validateLogic(data);

    isValid = schemaErrors.size === 0 && dataErrors.size === 0;
  } catch (e) {
    console.error(e);
    throw new Error('Internal error with validation process.');
  }

  if (!isValid) {
    throw new ValidationError('Invalid protocol', schemaErrors, dataErrors);
  }
};