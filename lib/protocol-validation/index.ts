import { ensureError } from '~/utils/ensureError';
import { Protocol } from './schemas/src/8.zod';
import { validateLogic } from './validation/validateLogic';
import { validateSchema } from './validation/validateSchema';

export type ValidationError = {
  path: string;
  message: string;
};

type ValidationResult = {
  isValid: boolean;
  schemaErrors: ValidationError[];
  logicErrors: ValidationError[];
  schemaVersion: number;
  schemaForced: boolean;
};

const validateProtocol = async (
  protocol: Protocol,
  forceSchemaVersion?: number,
) => {
  if (protocol === undefined) {
    throw new Error('Protocol is undefined');
  }

  try {
    const { hasErrors: hasSchemaErrors, errors: schemaErrors } =
      await validateSchema(protocol, forceSchemaVersion);
    const { hasErrors: hasLogicErrors, errors: logicErrors } =
      validateLogic(protocol);

    return {
      isValid: !hasSchemaErrors && !hasLogicErrors,
      schemaErrors,
      logicErrors,
      schemaVersion: protocol.schemaVersion,
      schemaForced: forceSchemaVersion !== undefined,
    } as ValidationResult;
  } catch (e) {
    const error = ensureError(e);

    throw new Error(
      `Protocol validation failed due to an internal error: ${error.message}`,
    );
  }
};

export { validateProtocol };
