import { type Variable } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcEgo,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { isNil, isString } from 'es-toolkit';
import { filter, get, isNumber, some } from 'es-toolkit/compat';
import { type ValidationContext } from './formContexts';
export type FieldValue = VariableValue | undefined;


// TanStack Form native validator types
export type TanStackValidatorParams = {
  value: FieldValue;
  fieldApi: {
    form: {
      store: { state: { values: Record<string, FieldValue> } };
    };
    name: string;
  };
  validationContext: ValidationContext;
};

export type TanStackValidator = (
  params: TanStackValidatorParams,
) => string | undefined;

// Factory function type for creating validators with options
export type TanStackValidatorFactory<T = unknown> = (
  options: T,
) => TanStackValidator;

// Return an array of values given either a collection, an array,
// or a single value
const coerceArray = (value: FieldValue) => {
  if (value instanceof Object) {
    return Object.values(value);
  }

  if (Array.isArray(value)) {
    return value;
  }
  return [];
};

/**
 * Compares two FieldValue types to determine if they match.
 * Handles various types including primitives, arrays, objects, coordinates, and null/undefined.
 *
 * @param submittedValue - The value being submitted or compared
 * @param existingValue - The value to compare against
 * @returns true if the values match, false otherwise
 */
const isMatchingValue = (
  submittedValue: FieldValue,
  existingValue: FieldValue,
): boolean => {
  // If both values are strictly equal, they match
  if (submittedValue === existingValue) {
    return true;
  }

  // Handle null and undefined cases
  if (
    submittedValue === null ||
    submittedValue === undefined ||
    existingValue === null ||
    existingValue === undefined
  ) {
    return submittedValue === existingValue;
  }

  // Handle arrays
  if (Array.isArray(submittedValue) && Array.isArray(existingValue)) {
    // Different length arrays don't match
    if (submittedValue.length !== existingValue.length) {
      return false;
    }

    // Check if every element matches
    return submittedValue.every((val, index) => {
      return isMatchingValue(val, existingValue[index]);
    });
  }

  // Handle coordinate objects {x, y}
  if (
    typeof submittedValue === 'object' &&
    typeof existingValue === 'object' &&
    'x' in submittedValue &&
    'y' in submittedValue &&
    'x' in existingValue &&
    'y' in existingValue
  ) {
    return (
      submittedValue.x === existingValue.x &&
      submittedValue.y === existingValue.y
    );
  }

  // Handle record objects
  if (
    typeof submittedValue === 'object' &&
    typeof existingValue === 'object' &&
    !Array.isArray(submittedValue) &&
    !Array.isArray(existingValue)
  ) {
    const submittedKeys = Object.keys(submittedValue);
    const existingKeys = Object.keys(existingValue);

    // Different number of keys means they don't match
    if (submittedKeys.length !== existingKeys.length) {
      return false;
    }

    // Check if all keys exist in both objects and have matching values
    return submittedKeys.every((key) => {
      return (
        key in existingValue &&
        isMatchingValue(
          (submittedValue as Record<string, FieldValue>)[key],
          (existingValue as Record<string, FieldValue>)[key],
        )
      );
    });
  }

  // For primitives and other cases, use strict equality
  return submittedValue === existingValue;
};

const isSomeValueMatching = (
  value: FieldValue,
  otherNetworkEntities: NcNode[] | NcEdge[] | NcEgo[],
  name: string,
) =>
  some(
    otherNetworkEntities,
    (entity) =>
      entity[entityAttributesProperty] &&
      isMatchingValue(value, entity[entityAttributesProperty][name]),
  );

const getOtherNetworkEntities = (
  entities: NcNode[] | NcEdge[] | NcEgo[],
  entityId?: string,
) =>
  filter(
    entities,
    (node) => !entityId || node[entityPrimaryKeyProperty] !== entityId,
  );

const getVariable = (variableId: string, context: ValidationContext) => {
  return get(context.codebookVariables, [variableId]);
};

const getVariableName = (variableId: string, context: ValidationContext) => {
  return get(context.codebookVariables, [variableId, 'name'], undefined);
};

const compareVariables = (
  value1: FieldValue,
  value2: FieldValue,
  type: Variable['type'],
) => {
  // check for null values
  if (isNil(value1) && isNil(value2)) {
    return 0;
  }

  if (isNil(value1)) {
    return -1;
  }

  if (isNil(value2)) {
    return 1;
  }

  // Check for objects
  if (value1 instanceof Object && value2 instanceof Object) {
    return JSON.stringify(value1).localeCompare(JSON.stringify(value2));
  }

  // check for booleans
  if (value1 === true && value2 === false) {
    return 1;
  }

  if (value1 === false && value2 === true) {
    return -1;
  }

  // check for dates
  if (type === 'datetime') {
    const date1 = new Date(value1 as string);
    const date2 = new Date(value2 as string);
    return date1.valueOf() - date2.valueOf();
  }

  // check for numbers (could be number, ordinal, scalar, etc)
  if (isNumber(value1) && isNumber(value2)) {
    return value1 - value2;
  }

  // string compare
  if (isString(value1) && isString(value2)) {
    return value1.localeCompare(value2);
  }

  return 0;
};

// Type representing a variable with a validation object
type VariableWithValidation = Extract<Variable, { validation?: unknown }>;
export type VariableValidation = NonNullable<
  VariableWithValidation['validation']
>;

// TanStack-native validation functions
export const tanStackValidations = {
  required:
    (message: string | true): TanStackValidator =>
    ({ value }) => {
      const isEmptyString = isString(value) && value.length === 0;

      if (isNil(value) || isEmptyString) {
        if (typeof message === 'string') {
          return message;
        }
        return 'You must answer this question before continuing';
      }

      return undefined;
    },

  requiredAcceptsNull:
    (message?: string): TanStackValidator =>
    ({ value }) => {
      if (isNil(value)) {
        return message ?? 'You must answer this question before continuing';
      }
      return undefined;
    },

  maxLength:
    (max: number): TanStackValidator =>
    ({ value }) =>
      value && isString(value) && value.length > max
        ? `Your answer must be ${max} characters or less`
        : undefined,

  minLength:
    (min: number): TanStackValidator =>
    ({ value }) =>
      !value || (isString(value) && value.length < min)
        ? `Your answer must be ${min} characters or more`
        : undefined,

  minValue:
    (min: number): TanStackValidator =>
    ({ value }) =>
      isNumber(value) && value < min
        ? `Your answer must be at least ${min}`
        : undefined,

  maxValue:
    (max: number): TanStackValidator =>
    ({ value }) =>
      isNumber(value) && value > max
        ? `Your answer must be less than ${max}`
        : undefined,

  minSelected:
    (min: number): TanStackValidator =>
    ({ value }) =>
      !value || coerceArray(value).length < min
        ? `You must choose a minimum of ${min} option(s)`
        : undefined,

  maxSelected:
    (max: number): TanStackValidator =>
    ({ value }) =>
      value && coerceArray(value).length > max
        ? `You must choose a maximum of ${max} option(s)`
        : undefined,

  unique:
    (): TanStackValidator =>
    ({ value, fieldApi, validationContext }) => {
      const otherNetworkEntities = getOtherNetworkEntities(
        validationContext.networkEntities,
        validationContext.currentEntityId,
      );

      return isSomeValueMatching(value, otherNetworkEntities, fieldApi.name)
        ? 'Your answer must be unique'
        : undefined;
    },

  differentFrom:
    (variableId: string): TanStackValidator =>
    ({ value, fieldApi, validationContext }) => {
      const variable = getVariable(variableId, validationContext);

      if (!variable) {
        return 'Variable not found in codebook';
      }

      const { name: variableName } = variable;
      const allValues = fieldApi.form.store.state.values;

      return isMatchingValue(value, allValues[variableId])
        ? `Your answer must be different from ${variableName}`
        : undefined;
    },

  sameAs:
    (variableId: string): TanStackValidator =>
    ({ value, fieldApi, validationContext }) => {
      const variableName = getVariableName(variableId, validationContext);
      const allValues = fieldApi.form.store.state.values;

      return !isMatchingValue(value, allValues[variableId])
        ? `Your answer must be the same as the value of "${variableName}"`
        : undefined;
    },

  greaterThanVariable:
    (variableId: string): TanStackValidator =>
    ({ value, fieldApi, validationContext }) => {
      const variable = getVariable(variableId, validationContext);

      if (!variable) {
        return 'Variable not found in codebook';
      }

      const { name: variableName, type: variableType } = variable;

      if (!variableName || !variableType) {
        return 'Variable not found in codebook';
      }

      const allValues = fieldApi.form.store.state.values;

      return isNil(value) ||
        compareVariables(value, allValues[variableId], variableType) <= 0
        ? `Your answer must be greater than the value of "${variableName}"`
        : undefined;
    },

  lessThanVariable:
    (variableId: string): TanStackValidator =>
    ({ value, fieldApi, validationContext }) => {
      const variable = getVariable(variableId, validationContext);

      if (!variable) {
        return 'Variable not found in codebook';
      }

      const { name: variableName, type: variableType } = variable;

      if (!variableName || !variableType) {
        return 'Variable not found in codebook';
      }

      const allValues = fieldApi.form.store.state.values;

      return isNil(value) ||
        compareVariables(value, allValues[variableId], variableType) >= 0
        ? `Your answer must be less than the value of "${variableName}"`
        : undefined;
    },
};

// TanStack-native validator function
export const getTanStackNativeValidators = (
  validation: VariableValidation,
  validationContext: ValidationContext,
) => {
  const entries = Object.entries(validation ?? {});

  const validators: TanStackValidator[] = entries.map(([type, options]) => {

    if (type in tanStackValidations) {
      const validatorFactory = tanStackValidations[
        type as keyof typeof tanStackValidations
      ] as TanStackValidatorFactory;
      return validatorFactory(options);
    }

    return () => `Validation "${type}" not found`;
  });

  // Extract dependent variables for onChangeListenTo
  const listenToVariables = entries
    .filter(([, options]) => typeof options === 'string')
    .map(([, variableId]) => variableId as string);

  return {
    onChangeListenTo:
      listenToVariables.length > 0 ? listenToVariables : undefined,
    onChange: ({
      value,
      fieldApi,
    }: {
      value: FieldValue;
      fieldApi: TanStackValidatorParams['fieldApi'];
    }) => {
      return validators
        .map((validator) => validator({ value, fieldApi, validationContext }))
        .find(Boolean);
    },
  };
};
