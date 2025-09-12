import { invariant } from 'es-toolkit';
import z from 'zod';
import { type FieldValue, type ValidationContext } from '../types';
import compareVariables from './compareVariables';
import collectNetworkValues from './utils/collectNetworkValues';
import { getVariableDefinition } from './utils/getVariableDefinition';
import isMatchingValue from './utils/isMatchingValue';

type ValidationFunction<T = string | boolean | number> = (
  // Parameter type is the value of the key/value pair of the protocol
  // validation object. required = boolean, maxLength = number,
  // unique = string etc.
  parameter: T,
  context: ValidationContext,
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
  const message = 'You must answer this question before continuing';

  return z.unknown().superRefine((value, ctx) => {
    const isEmptyString =
      typeof value === 'string' && value.trim().length === 0;

    if (value === null || value === undefined || isEmptyString) {
      ctx.addIssue({
        code: 'custom',
        message: message,
        path: [],
      });
    }

    // Handle number fields
    if (typeof value === 'number') {
      if (isNaN(value)) {
        ctx.addIssue({
          code: 'custom',
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
          message: message,
          path: [],
        });
      }
    }
  });
};

/**
 * Require that a string be shorter than a maximum length
 */
const maxLength: ValidationFunction<number> = (max) => () => {
  invariant(max, 'Max length must be specified');

  return z.unknown().refine(
    (value) => {
      if (typeof value === 'string' && value.length > max) {
        return false;
      }
      return true;
    },
    {
      message: `You must enter no more than ${max} characters.`,
    },
  );
};

/**
 * Require that a string be longer than a minimum length
 */
const minLength: ValidationFunction<number> = (min) => () => {
  invariant(min, 'Min length must be specified');

  return z.unknown().refine(
    (value) => {
      if (typeof value === 'string' && value.length < min) {
        return false;
      }
      return true;
    },
    {
      message: `You must enter at least ${min} characters.`,
    },
  );
};

/**
 * Require that a number be greater than a minimum value
 */
const minValue: ValidationFunction<number> = (min) => () => {
  invariant(!isNaN(Number(min)), 'Min value must be specified');

  return z.unknown().refine(
    (value) => {
      if (typeof value === 'number' && value < min) {
        return false;
      }
      return true;
    },
    {
      message: `You must enter a value greater than ${min}.`,
    },
  );
};

/**
 * Require that a number be less than a maximum value
 */
const maxValue: ValidationFunction<number> = (max) => () => {
  invariant(max, 'Max value must be specified');

  return z.unknown().refine(
    (value) => {
      if (typeof value === 'number' && value > max) {
        return false;
      }
      return true;
    },
    {
      message: `You must enter a value less than ${max}.`,
    },
  );
};

/**
 * Require that an array have a minimum number of elements
 */
const minSelected: ValidationFunction<number> = (min) => () => {
  invariant(typeof min === 'number', 'Min items must be specified');

  return z.array(z.unknown()).superRefine((value, ctx) => {
    if (value.length < min) {
      ctx.addIssue({
        code: 'too_small',
        minimum: min,
        origin: 'array',
        message: `You must choose a minimum of ${min} option${min === 1 ? '' : 's'}.`,
        path: [],
      });
    }
  });
};

/**
 * Require that an array have a maximum number of elements
 */
const maxSelected: ValidationFunction<number> = (max) => () => {
  invariant(typeof max === 'number', 'Max items must be specified');

  return z.array(z.unknown()).superRefine((value, ctx) => {
    if (value.length > max) {
      ctx.addIssue({
        code: 'too_big',
        maximum: max,
        origin: 'array',
        message: `You can choose a maximum of ${max} option${max === 1 ? '' : 's'}.`,
        path: [],
      });
    }
  });
};

/**
 * Require that a value is unique among all entities of the same type in the
 * current network
 */
const unique: ValidationFunction = (attribute, context) => () => {
  const { stageSubject, network } = context;

  return z.unknown().superRefine((value, ctx) => {
    invariant(stageSubject.entity !== 'ego', 'Not applicable to ego entities');
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
        message: 'This value must be unique.',
        path: [],
      });
    }
  });
};

/**
 * Require that a value is different from another variable in the same form
 *
 * Note: although we are comparing with the *current form only*, we still
 * need to get the comparison variable from the codebook, because we need to
 * know its name.
 */
const differentFrom: ValidationFunction =
  (attribute, context) => (formValues) => {
    const { stageSubject, codebook } = context;

    return z.unknown().superRefine((value, ctx) => {
      invariant(
        typeof attribute === 'string',
        'Attribute must be specified for differentFrom validation',
      );
      invariant(
        attribute in formValues,
        'Form values must contain the attribute being compared',
      );

      // Get the codebook definition for the variable we are comparing to
      const comparisonVariable = getVariableDefinition(
        codebook,
        stageSubject,
        attribute,
      );

      invariant(
        comparisonVariable,
        'Comparison variable not found in codebook',
      );

      if (isMatchingValue(value, formValues[attribute])) {
        ctx.addIssue({
          code: 'custom',
          message: `Your answer must be different from '${comparisonVariable.name}'`,
          path: [],
        });
      }
    });
  };

/**
 * Require that a value be the same as another variable in the same form
 *
 * See note about comparison variables in the `differentFrom` validation.
 */
const sameAs: ValidationFunction = (attribute, context) => (formValues) => {
  const { stageSubject, codebook } = context;

  return z.unknown().superRefine((value, ctx) => {
    invariant(
      typeof attribute === 'string',
      'Attribute must be specified for sameAs validation',
    );
    invariant(
      attribute in formValues,
      'Form values must contain the attribute being compared',
    );

    // Get the codebook definition for the variable we are comparing to
    const comparisonVariable = getVariableDefinition(
      codebook,
      stageSubject,
      attribute,
    );

    invariant(comparisonVariable, 'Comparison variable not found in codebook');

    if (!isMatchingValue(value, formValues[attribute])) {
      ctx.addIssue({
        code: 'custom',
        message: `Your answer must be the same as '${comparisonVariable.name}'`,
        path: [],
      });
    }
  });
};

/**
 * Require that a value be greater than another variable in the same form
 */
const greaterThanVariable: ValidationFunction =
  (attribute, context) => (formValues) => {
    const { stageSubject, codebook } = context;

    return z.unknown().superRefine((value, ctx) => {
      invariant(
        typeof attribute === 'string',
        'Attribute must be specified for greaterThanVariable validation',
      );
      invariant(
        attribute in formValues,
        'Form values must contain the attribute being compared',
      );

      // Get the codebook definition for the variable we are comparing to
      const comparisonVariable = getVariableDefinition(
        codebook,
        stageSubject,
        attribute,
      );

      invariant(
        comparisonVariable,
        'Comparison variable not found in codebook',
      );

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
          message: `Your answer must be greater than '${comparisonVariable.name}'`,
          path: [],
        });
      }
    });
  };

/**
 * Require that a value be less than another variable in the same form
 */
const lessThanVariable: ValidationFunction =
  (attribute, context) => (formValues) => {
    const { stageSubject, codebook } = context;

    return z.unknown().superRefine((value, ctx) => {
      invariant(
        typeof attribute === 'string',
        'Attribute must be specified for lessThanVariable validation',
      );
      invariant(
        attribute in formValues,
        'Form values must contain the attribute being compared',
      );

      // Get the codebook definition for the variable we are comparing to
      const comparisonVariable = getVariableDefinition(
        codebook,
        stageSubject,
        attribute,
      );

      invariant(
        comparisonVariable,
        'Comparison variable not found in codebook',
      );

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
          message: `Your answer must be less than '${comparisonVariable.name}'`,
          path: [],
        });
      }
    });
  };

export const validations = {
  required,
  requiredAcceptsNull: required, // TODO - remove;
  minLength,
  maxLength,
  minValue,
  maxValue,
  minSelected,
  maxSelected,
  unique,
  differentFrom,
  sameAs,
  greaterThanVariable,
  lessThanVariable,
} satisfies Record<string, ValidationFunction>;
