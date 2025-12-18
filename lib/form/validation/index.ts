import { invariant } from 'es-toolkit';
import z from 'zod';
import { type FieldValue, type ValidationContext } from '../components/types';
import compareVariables from './compareVariables';
import collectNetworkValues from './utils/collectNetworkValues';
import { getVariableDefinition } from './utils/getVariableDefinition';
import isMatchingValue from './utils/isMatchingValue';

export type ValidationParameter =
  | string
  | number
  | boolean
  | Record<string, unknown>;

export type ValidationFunction<T extends ValidationParameter> = (
  // Parameter type is the value of the key/value pair of the protocol
  // validation object. required = boolean, maxLength = number,
  // unique = string etc.
  parameter: T,
  context?: ValidationContext,
) => (formValues: Record<string, FieldValue>) => z.ZodType;

/**
 * Make a field required
 *
 * This works differently depending on the type of variable it is applied to:
 *
 * - text: not null, no strings with only spaces
 * - number: not null, but zero is permitted
 * - scalar: not null, zero is permitted
 * - datetime: not null, empty string is not permitted
 * - boolean: not null
 * - categorical: not null, empty array is not permitted
 */
export const required = () => () => {
  // TODO: localisation.
  const message = 'You must answer this question before continuing.';

  return z.unknown().superRefine((value, ctx) => {
    const isEmptyString =
      typeof value === 'string' && value.trim().length === 0;

    if (value === null || value === undefined || isEmptyString) {
      ctx.addIssue({
        code: 'custom',
        input: value,
        message: message,
        path: [],
      });
    }

    // Handle number fields
    if (typeof value === 'number') {
      if (isNaN(value)) {
        ctx.addIssue({
          code: 'custom',
          input: value,
          message: message,
          path: [],
        });
      }
    }

    // Handle array fields
    if (Array.isArray(value)) {
      if (value.length === 0) {
        ctx.addIssue({
          code: 'custom',
          input: value,
          message: message,
          path: [],
        });
      }
    }
  }); // No hint for required because we use the asterisk in the UI
};

/**
 * Require that a string be shorter than a maximum length
 */
const maxLength: ValidationFunction<number> = (max) => () => {
  invariant(max, 'Max length must be specified');

  const hint = `Enter at most ${max} characters.`;

  return z
    .string()
    .max(max, {
      message: `Too long. Enter fewer than than ${max} characters.`,
    })
    .prefault('')
    .meta({ hint });
};

/**
 * Require that a string be longer than a minimum length
 */
const minLength: ValidationFunction<number> = (min) => () => {
  invariant(min, 'Min length must be specified');

  const hint = `Enter at least ${min} characters.`;

  return z
    .string()
    .min(min, {
      message: `Too short. Enter at least ${min} characters.`,
    })
    .prefault('')
    .meta({ hint });
};

/**
 * Require that a number be greater than or equal to a minimum value
 */
const minValue: ValidationFunction<number> = (min) => () => {
  invariant(!isNaN(Number(min)), 'Min value must be specified');

  const hint = `Enter a value greater than or equal to ${min}.`;

  return z
    .number()
    .gte(min, {
      message: `Too small. Value must be at least ${min}.`,
    })
    .prefault(min - 1)
    .meta({ hint });
};

/**
 * Require that a number be less than or equal to a maximum value
 */
const maxValue: ValidationFunction<number> = (max) => () => {
  invariant(max, 'Max value must be specified');

  const hint = `Enter a value less than or equal to ${max}.`;

  return z
    .number()
    .lte(max, {
      message: `Too large. Value must be at most ${max}.`,
    })
    .prefault(max - 1)
    .meta({ hint });
};

/**
 * Require that an array have a minimum number of elements
 */
const minSelected: ValidationFunction<number> = (min) => () => {
  invariant(typeof min === 'number', 'Min items must be specified');

  const hint = `Select at least ${min} value${min === 1 ? '' : 's'}.`;

  return z
    .array(z.unknown())
    .min(min, {
      message: `Too few selected. Select at least ${min} value${min === 1 ? '' : 's'}.`,
    })
    .prefault([])
    .meta({ hint });
};

/**
 * Require that an array have a maximum number of elements
 */
const maxSelected: ValidationFunction<number> = (max) => () => {
  invariant(typeof max === 'number', 'Max items must be specified');

  const hint = `Select a maximum of ${max} value${max === 1 ? '' : 's'}.`;

  return z
    .array(z.unknown())
    .max(max, {
      message: `Too many items selected. Select a maximum of ${max} value${max === 1 ? '' : 's'}.`,
    })
    .prefault(Array.from({ length: max }, () => null))
    .meta({ hint });
};

/**
 * Require that a value is unique among all entities of the same type in the
 * current network
 */
const unique: ValidationFunction<string> = (attribute, context) => () => {
  invariant(
    context,
    'Validation context must be provided when using unique validation',
  );
  const { stageSubject, network } = context;

  const hint = 'Must be unique.';

  return z
    .unknown()
    .superRefine((value, ctx) => {
      invariant(
        stageSubject.entity !== 'ego',
        'Not applicable to ego entities',
      );
      invariant(
        typeof attribute === 'string',
        'Attribute must be specified for unique validation',
      );

      // Collect other values of the same type.
      const existingValues = collectNetworkValues(
        network,
        stageSubject,
        attribute,
      );

      if (existingValues.some((v) => isMatchingValue(value, v))) {
        ctx.addIssue({
          code: 'custom',
          message: 'This value is used elsewhere. It must be unique.',
          path: [],
        });
      }
    })
    .meta({ hint });
};

/**
 * Require that a value is different from another variable in the same form
 *
 * Note: although we are comparing with the *current form only*, we still
 * need to get the comparison variable from the codebook, because we need to
 * know its name.
 */
const differentFrom: ValidationFunction<string> =
  (attribute, context) => (formValues) => {
    invariant(
      context,
      'Validation context must be provided when using differentFrom validation',
    );

    invariant(
      typeof attribute === 'string',
      'Attribute must be specified for differentFrom validation',
    );

    const { stageSubject, codebook } = context;

    // Get the codebook definition for the variable we are comparing to
    const comparisonVariable = getVariableDefinition(
      codebook,
      stageSubject,
      attribute,
    );

    invariant(comparisonVariable, 'Comparison variable not found in codebook');

    return z
      .unknown()
      .superRefine((value, ctx) => {
        // Only validate if the comparison attribute exists in formValues
        if (!(attribute in formValues)) {
          return;
        }
        if (isMatchingValue(value, formValues[attribute])) {
          ctx.addIssue({
            code: 'custom',
            message: `Your answer must be different from '${comparisonVariable.name}'.`,
            path: [],
          });
        }
      })
      .meta({ hint: `Must be different from '${comparisonVariable.name}'.` });
  };

/**
 * Require that a value be the same as another variable in the same form
 *
 * See note about comparison variables in the `differentFrom` validation.
 */
const sameAs: ValidationFunction<string> =
  (attribute, context) => (formValues) => {
    invariant(
      context,
      'Validation context must be provided when using sameAs validation',
    );

    invariant(
      typeof attribute === 'string',
      'Attribute must be specified for sameAs validation',
    );

    const { stageSubject, codebook } = context;

    // Get the codebook definition for the variable we are comparing to
    const comparisonVariable = getVariableDefinition(
      codebook,
      stageSubject,
      attribute,
    );

    invariant(comparisonVariable, 'Comparison variable not found in codebook');

    return z
      .unknown()
      .superRefine((value, ctx) => {
        // Only validate if the comparison attribute exists in formValues
        if (!(attribute in formValues)) {
          return;
        }
        if (!isMatchingValue(value, formValues[attribute])) {
          ctx.addIssue({
            code: 'custom',
            message: `Your answer must be the same as '${comparisonVariable.name}'.`,
            path: [],
          });
        }
      })
      .meta({ hint: `Must match the value of '${comparisonVariable.name}'.` });
  };

/**
 * Require that a value be greater than another variable in the same form
 */
const greaterThanVariable: ValidationFunction<string> =
  (attribute, context) => (formValues) => {
    invariant(
      typeof attribute === 'string',
      'Attribute must be specified for greaterThanVariable validation',
    );

    invariant(
      context,
      'Validation context must be provided when using greaterThanVariable validation',
    );

    const { stageSubject, codebook } = context;

    // Get the codebook definition for the variable we are comparing to
    const comparisonVariable = getVariableDefinition(
      codebook,
      stageSubject,
      attribute,
    );

    invariant(comparisonVariable, 'Comparison variable not found in codebook');

    return z
      .unknown()
      .superRefine((value, ctx) => {
        // Only validate if the comparison attribute exists in formValues
        if (!(attribute in formValues)) {
          return;
        }
        if (
          compareVariables(
            value,
            formValues[attribute],
            comparisonVariable.type,
          ) < 0
        ) {
          ctx.addIssue({
            code: 'too_small',
            minimum: Number(formValues[attribute]),
            inclusive: false,
            origin: comparisonVariable.type === 'datetime' ? 'date' : 'number',
            message: `Your answer must be greater than the value of '${comparisonVariable.name}'.`,
            path: [],
          });
        }
      })
      .meta({
        hint: `Must be greater than the value of '${comparisonVariable.name}'.`,
      });
  };

/**
 * Require that a value matches a pattern. Designed to mirror the 'pattern'
 * attribute of HTML5 input elements.
 */
const pattern: ValidationFunction<{
  regex: string;
  errorMessage: string;
  hint: string;
}> =
  ({ regex, errorMessage, hint }) =>
  () => {
    invariant(regex, 'Regex must be specified');
    invariant(hint, 'Hint must be specified for pattern validation');

    return z
      .string()
      .regex(new RegExp(regex), {
        message: errorMessage,
      })
      .prefault('')
      .meta({ hint });
  };

/**
 * Require that a value be less than another variable in the same form
 */
const lessThanVariable: ValidationFunction<string> =
  (attribute, context) => (formValues) => {
    invariant(
      context,
      'Validation context must be provided when using lessThanVariable validation',
    );
    const { stageSubject, codebook } = context;

    invariant(
      typeof attribute === 'string',
      'Attribute must be specified for lessThanVariable validation',
    );

    // Get the codebook definition for the variable we are comparing to
    const comparisonVariable = getVariableDefinition(
      codebook,
      stageSubject,
      attribute,
    );

    invariant(comparisonVariable, 'Comparison variable not found in codebook');

    return z
      .unknown()
      .superRefine((value, ctx) => {
        // Only validate if the comparison attribute exists in formValues
        if (!(attribute in formValues)) {
          return;
        }

        if (
          compareVariables(
            value,
            formValues[attribute],
            comparisonVariable.type,
          ) > 0
        ) {
          ctx.addIssue({
            code: 'too_big',
            maximum: Number(formValues[attribute]),
            inclusive: false,
            origin: comparisonVariable.type === 'datetime' ? 'date' : 'number',
            message: `Your answer must be less than the value of '${comparisonVariable.name}'.`,
            path: [],
          });
        }
      })
      .meta({
        hint: `Must be less than the value of '${comparisonVariable.name}'.`,
      });
  };

const email = () => () => {
  const hint = 'Must be a valid email address.';

  return z
    .email({ message: 'Enter a valid email address.' })
    .prefault('')
    .meta({ hint });
};

export const validations = {
  email,
  required,
  minLength,
  maxLength,
  pattern,
  minValue,
  maxValue,
  minSelected,
  maxSelected,
  unique,
  differentFrom,
  sameAs,
  greaterThanVariable,
  lessThanVariable,
};
