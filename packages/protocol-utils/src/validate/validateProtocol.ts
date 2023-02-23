import validateSchema from "./validateSchema.js";
import validateLogic from "./validateLogic.js";

type ValidateProtocolReturn = boolean | ValidationError;

export class ValidationError extends Error {
  constructor(message: string, public schemaErrors: Array<string>, public dataErrors: Array<string>) {
    super(message); // (1)
    this.name = "ValidationError"; // (2)
    this.schemaErrors = [];
    this.dataErrors = [];
  }
}

export const validateProtocol = (jsonString: string, forceVersion?: number): ValidateProtocolReturn => {
  let data;

  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    console.error(e);
    throw new Error('Invalid JSON file');
  }

  let schemaErrors: [] = [];
  let dataErrors: [] = [];
  let isValid: boolean = false;

  try {
    const schemaErrors = validateSchema(data, forceVersion);
    const dataErrors = validateLogic(data);
    isValid = !schemaErrors.length && !dataErrors.length;
  } catch (e) {
    console.error(e);
    throw new Error('Internal error with validation process.');
  }

  if (isValid) {
    return true;
  }

  throw new ValidationError('Invalid protocol', schemaErrors, dataErrors);
};