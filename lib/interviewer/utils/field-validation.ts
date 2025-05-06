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
import { getCodebookVariablesForSubjectType } from '../selectors/protocol';
import { getNetworkEntitiesForType } from '../selectors/session';
import { type AppStore } from '../store';

export type FieldValue = VariableValue | undefined;

// Approximated from the description in the redux-form documentation
// https://redux-form.com/8.3.0/docs/api/field.md/#input-props
type ValidationFunction = (
  value: FieldValue,
  allValues: Record<string, FieldValue>,
  props: Record<string, unknown>,
  name: string,
) => string | undefined;

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

// TODO: This one is awkward because the protocol spec uses true, but we need
// to be able to specify a string for the message in some cases. A better
// design would probably be to have a separate validation function for
// required that takes a message.
export const required = (message: string | true) => (value: FieldValue) => {
  const isEmptyString = isString(value) && value.length === 0;

  if (isNil(value) || isEmptyString) {
    // If initialised with a string, assume required is true
    // and return the string as the message
    if (typeof message === 'string') {
      return message;
    }

    // Otherwise, return the default message. Note: 'false' is not handled because
    // we have never used it.
    return 'You must answer this question before continuing';
  }

  return undefined;
};

const requiredAcceptsNull = (message?: string) => (value: FieldValue) => {
  if (isNil(value)) {
    return message ?? 'You must answer this question before continuing';
  }

  return undefined;
};

export const maxLength = (max: number) => (value: string) =>
  value && value.length > max
    ? `Your answer must be ${max} characters or less`
    : undefined;
export const minLength = (min: number) => (value: string) =>
  !value || value.length < min
    ? `Your answer must be ${min} characters or more`
    : undefined;
export const minValue = (min: number) => (value: number) =>
  isNumber(value) && value < min
    ? `Your answer must be at least ${min}`
    : undefined;
export const maxValue = (max: number) => (value: number) =>
  isNumber(value) && value > max
    ? `Your answer must be less than ${max}`
    : undefined;

export const minSelected = (min: number) => (value: FieldValue) =>
  !value || coerceArray(value).length < min
    ? `You must choose a minimum of ${min} option(s)`
    : undefined;

export const maxSelected = (max: number) => (value: FieldValue) =>
  value && coerceArray(value).length > max
    ? `You must choose a maximum of ${max} option(s)`
    : undefined;

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

export const unique = (_: unknown, store: AppStore) => {
  return (
    value: FieldValue,
    __: Record<string, FieldValue>,
    {
      validationMeta,
    }: {
      validationMeta: { entityId?: string };
    },
    name: string,
  ) => {
    const otherNetworkEntities = getOtherNetworkEntities(
      getNetworkEntitiesForType(store.getState()),
      validationMeta?.entityId,
    );

    return isSomeValueMatching(value, otherNetworkEntities, name)
      ? 'Your answer must be unique'
      : undefined;
  };
};

const getVariable = (variableId: string, store: AppStore) => {
  const codebookVariablesForType = getCodebookVariablesForSubjectType(
    store.getState(),
  );

  return get(codebookVariablesForType, [variableId]);
};

const getVariableName = (variableId: string, store: AppStore) => {
  const codebookVariablesForType = getCodebookVariablesForSubjectType(
    store.getState(),
  );

  return get(codebookVariablesForType, [variableId, 'name'], undefined);
};

export const differentFrom = (variableId: string, store: AppStore) => {
  const variable = getVariable(variableId, store);

  if (!variable) {
    return () => 'Variable not found in codebook';
  }

  const { name: variableName } = variable;

  return (value: FieldValue, allValues: Record<string, FieldValue>) =>
    isMatchingValue(value, allValues[variableId])
      ? `Your answer must be different from ${variableName}`
      : undefined;
};

export const sameAs = (variableId: string, store: AppStore) => {
  const variableName = getVariableName(variableId, store);
  return (value: FieldValue, allValues: Record<string, FieldValue>) =>
    !isMatchingValue(value, allValues[variableId])
      ? `Your answer must be the same as the value of "${variableName}"`
      : undefined;
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

export const greaterThanVariable = (variableId: string, store: AppStore) => {
  const variable = getVariable(variableId, store);

  if (!variable) {
    return () => 'Variable not found in codebook';
  }

  const { name: variableName, type: variableType } = variable;

  if (!variableName || !variableType) {
    return () => 'Variable not found in codebook';
  }

  return (value: FieldValue, allValues: Record<string, FieldValue>) =>
    isNil(value) ||
    compareVariables(value, allValues[variableId], variableType) <= 0
      ? `Your answer must be greater than the value of "${variableName}"`
      : undefined;
};

// Note: variableId is the variable being _compared_ to!
export const lessThanVariable = (variableId: string, store: AppStore) => {
  const variable = getVariable(variableId, store);

  if (!variable) {
    return () => 'Variable not found in codebook';
  }

  const { name: variableName, type: variableType } = variable;

  if (!variableName || !variableType) {
    return () => 'Variable not found in codebook';
  }

  return (value: FieldValue, allValues: Record<string, FieldValue>) =>
    isNil(value) ||
    compareVariables(value, allValues[variableId], variableType) >= 0
      ? `Your answer must be less than the value of "${variableName}"`
      : undefined;
};

// Type representing a variable with a validation object
type VariableWithValidation = Extract<Variable, { validation?: unknown }>;

const validations = {
  required,
  requiredAcceptsNull,
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

/**
 *
 * Takes a validation array/function, and injects the store (needed)
 * Returns the named validation function, if no matching one is found it returns a validation
 * which will always fail.
 * @param {object} validation The validation object
 * @param {object} store The redux store
 * @returns {function} The validation function
 */
export const getValidation = (
  validation: NonNullable<VariableWithValidation['validation']> &
    Record<string, ValidationFunction>,
  store: AppStore,
) => {
  const entries = Object.entries(validation);

  return entries.map(([type, options]) => {
    if (type in validations) {
      const fn = validations[type as keyof typeof validations];
      // Cast the function to accept any type for options since we know it's from our validations
      return (fn as (options: unknown, store: AppStore) => ValidationFunction)(
        options,
        store,
      );
    }

    // Allow custom validations by specifying a function
    if (typeof options === 'function') {
      return options;
    }

    return () => `Validation "${type}" not found`;
  });
};
