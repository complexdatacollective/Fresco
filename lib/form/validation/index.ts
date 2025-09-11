import { invariant } from 'es-toolkit';
import z from 'zod';
import { FieldValue, ValidationContext } from '../types';
import compareVariables from './compareVariables';
import collectNetworkValues from './utils/collectNetworkValues';
import { getVariableDefinition } from './utils/getVariableDefinition';
import isMatchingValue from './utils/isMatchingValue';

type ValidationFunctionParameters = {
  formValues: Record<string, unknown>;
  context: ValidationContext;
  max?: number; // maxLength, maxValue
  min?: number; // minLength, minValue
  attribute?: string; // Unique, differentFrom, sameAs
};

type ValidationFunction = (
  parameters: ValidationFunctionParameters,
) => z.ZodType;

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
export const required: ValidationFunction = (parameters) => {
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
const maxLength: ValidationFunction = (parameters) => {
  const { max } = parameters;

  invariant(max, 'Max length must be specified');

  return z
    .string()
    .max(max)
    .superRefine((value, ctx) => {
      if (value.length > max) {
        ctx.addIssue({
          code: 'too_big',
          maximum: max,
          origin: 'string',
          message: `Your answer must be ${max} characters or less.`,
          path: [],
        });
      }
    });
};

/**
 * Require that a string be longer than a minimum length
 */
const minLength: ValidationFunction = (parameters) => {
  const { min } = parameters;

  invariant(min, 'Min length must be specified');

  return z
    .string()
    .min(min)
    .superRefine((value, ctx) => {
      if (value.length < min) {
        ctx.addIssue({
          code: 'too_small',
          minimum: min,
          origin: 'string',
          message: `Your answer must be ${min} characters or more.`,
          path: [],
        });
      }
    });
};

/**
 * Require that a number be greater than a minimum value
 */
const minValue: ValidationFunction = (parameters) => {
  const { min } = parameters;

  invariant(min, 'Min value must be specified');

  return z
    .number()
    .min(min)
    .superRefine((value, ctx) => {
      if (value < min) {
        ctx.addIssue({
          code: 'too_small',
          minimum: min,
          origin: 'number',
          message: `Your answer must be at least ${min}.`,
          path: [],
        });
      }
    });
};

/**
 * Require that a number be less than a maximum value
 */
const maxValue: ValidationFunction = (parameters) => {
  const { max } = parameters;

  invariant(max, 'Max value must be specified');

  return z
    .number()
    .max(max)
    .superRefine((value, ctx) => {
      if (value > max) {
        ctx.addIssue({
          code: 'too_big',
          maximum: max,
          origin: 'number',
          message: `Your answer must be less than ${max}.`,
          path: [],
        });
      }
    });
};

/**
 * Require that an array have a minimum number of elements
 */
const minSelected: ValidationFunction = (parameters) => {
  const { min } = parameters;

  invariant(min, 'Min items must be specified');

  return z
    .array(z.unknown())
    .min(min)
    .superRefine((value, ctx) => {
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
const maxSelected: ValidationFunction = (parameters) => {
  const { max } = parameters;

  invariant(max, 'Max items must be specified');

  return z
    .array(z.unknown())
    .max(max)
    .superRefine((value, ctx) => {
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
const unique: ValidationFunction = (parameters) => {
  const { context, attribute } = parameters;

  const { subject, network } = context;

  return z.unknown().superRefine((value, ctx) => {
    invariant(subject.entity !== 'ego', 'Not applicable to ego entities');
    invariant(attribute, 'Attribute must be specified for unique validation');

    // Collect other values of the same type.
    const existingValues = collectNetworkValues(network, subject, attribute);

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
const differentFrom: ValidationFunction = (parameters) => {
  const { context, attribute, formValues } = parameters;

  const { subject, codebook } = context;

  return z.unknown().superRefine((value, ctx) => {
    invariant(
      attribute,
      'Attribute must be specified for differentFrom validation',
    );
    invariant(
      attribute in formValues,
      'Form values must contain the attribute being compared',
    );

    // Get the codebook definition for the variable we are comparing to
    const comparisonVariable = getVariableDefinition(
      codebook,
      subject,
      attribute,
    );

    invariant(comparisonVariable, 'Comparison variable not found in codebook');

    if (isMatchingValue(value, formValues[attribute] as FieldValue)) {
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
const sameAs: ValidationFunction = (parameters) => {
  const { context, attribute, formValues } = parameters;

  const { subject, codebook } = context;

  return z.unknown().superRefine((value, ctx) => {
    invariant(attribute, 'Attribute must be specified for sameAs validation');
    invariant(
      attribute in formValues,
      'Form values must contain the attribute being compared',
    );

    // Get the codebook definition for the variable we are comparing to
    const comparisonVariable = getVariableDefinition(
      codebook,
      subject,
      attribute,
    );

    invariant(comparisonVariable, 'Comparison variable not found in codebook');

    if (isMatchingValue(value, formValues[attribute] as FieldValue)) {
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
const greaterThanVariable: ValidationFunction = (parameters) => {
  const { context, attribute, formValues } = parameters;

  const { subject, codebook } = context;

  return z.unknown().superRefine((value, ctx) => {
    invariant(
      attribute,
      'Attribute must be specified for greaterThanVariable validation',
    );
    invariant(
      attribute in formValues,
      'Form values must contain the attribute being compared',
    );

    // Get the codebook definition for the variable we are comparing to
    const comparisonVariable = getVariableDefinition(
      codebook,
      subject,
      attribute,
    );

    invariant(comparisonVariable, 'Comparison variable not found in codebook');

    if (
      compareVariables(
        value,
        formValues[attribute] as FieldValue,
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
const lessThanVariable: ValidationFunction = (parameters) => {
  const { context, attribute, formValues } = parameters;

  const { subject, codebook } = context;

  return z.unknown().superRefine((value, ctx) => {
    invariant(
      attribute,
      'Attribute must be specified for lessThanVariable validation',
    );
    invariant(
      attribute in formValues,
      'Form values must contain the attribute being compared',
    );

    // Get the codebook definition for the variable we are comparing to
    const comparisonVariable = getVariableDefinition(
      codebook,
      subject,
      attribute,
    );

    invariant(comparisonVariable, 'Comparison variable not found in codebook');

    if (
      compareVariables(
        value,
        formValues[attribute] as FieldValue,
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
};
