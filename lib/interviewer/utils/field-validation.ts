import { type VariableType } from '@codaco/protocol-validation';
import {
  entityPrimaryKeyProperty,
  type VariableValue,
} from '@codaco/shared-consts';
import { isEqual, isNil, isString } from 'es-toolkit';
import { filter, get, isNumber, some } from 'es-toolkit/compat';
import { getCodebookVariablesForSubjectType } from '../selectors/protocol';
import { getNetworkEntitiesForType } from '../selectors/session';
import { type AppStore } from '../store';

export type FieldValue = VariableValue | undefined;

export type ValidationFunction = (
  value: FieldValue,
  allValues: Record<string, FieldValue>,
) => string | undefined;

export type ReduxFormValidation = ValidationFunction | ValidationFunction[];

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

export const required = (message?: string) => (value: FieldValue) => {
  const isEmptyString = isString(value) && value.length === 0;

  if (isNil(value) || isEmptyString) {
    return message ?? 'You must answer this question before continuing';
  }

  return undefined;
};

export const requiredAcceptsNull =
  (message?: string) => (value: FieldValue) => {
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

export const isMatchingValue = (
  submittedValue: unknown[],
  existingValue: unknown,
) => {
  if (submittedValue && existingValue && existingValue instanceof Array) {
    return isEqual(submittedValue.sort(), existingValue.sort());
  }
  if (submittedValue && existingValue && existingValue instanceof Object) {
    return isEqual(submittedValue, existingValue);
  }
  return submittedValue === existingValue;
};

export const isSomeValueMatching = (
  value: unknown,
  otherNetworkEntities,
  name: string,
) =>
  some(
    otherNetworkEntities,
    (entity) =>
      entity.attributes && isMatchingValue(value, entity.attributes[name]),
  );

export const getOtherNetworkEntities = (entities, entityId: string) =>
  filter(
    entities,
    (node) => !entityId || node[entityPrimaryKeyProperty] !== entityId,
  );

export const unique = (_: unknown, store: AppStore) => {
  return (value: unknown, __: unknown, { validationMeta }, name: string) => {
    const otherNetworkEntities = getOtherNetworkEntities(
      getNetworkEntitiesForType(store.getState()),
      validationMeta?.entityId,
    );

    return isSomeValueMatching(value, otherNetworkEntities, name)
      ? 'Your answer must be unique'
      : undefined;
  };
};

const getVariableName = (variableId: string, store: AppStore) => {
  const codebookVariablesForType = getCodebookVariablesForSubjectType(
    store.getState(),
  );
  return get(codebookVariablesForType, [variableId, 'name'], undefined) as
    | string
    | undefined;
};

const getVariableType = (variableId: string, store: AppStore) => {
  const codebookVariablesForType = getCodebookVariablesForSubjectType(
    store.getState(),
  );
  return get(codebookVariablesForType, [variableId, 'type']) as
    | VariableType
    | undefined;
};

export const differentFrom = (variableId: string, store: AppStore) => {
  const variableName = getVariableName(variableId, store);
  return (value: unknown, allValues: Record<string, unknown>) =>
    isMatchingValue(value, allValues[variableId])
      ? `Your answer must be different from ${variableName}`
      : undefined;
};

export const sameAs = (variableId: string, store: AppStore) => {
  const variableName = getVariableName(variableId, store);
  return (value: unknown, allValues: Record<string, unknown>) =>
    !isMatchingValue(value, allValues[variableId])
      ? `Your answer must be the same as ${variableName}`
      : undefined;
};

const compareVariables = (
  value1: FieldValue,
  value2: FieldValue,
  type: VariableType,
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
  const variableName = getVariableName(variableId, store);
  const variableType = getVariableType(variableId, store);

  if (!variableName || !variableType) {
    return () => 'Variable not found';
  }

  return (value: FieldValue, allValues: Record<string, FieldValue>) =>
    isNil(value) ||
    compareVariables(value, allValues[variableId], variableType) <= 0
      ? `Your answer must be greater than ${variableName}`
      : undefined;
};

export const lessThanVariable = (variableId: string, store: AppStore) => {
  const variableName = getVariableName(variableId, store);
  const variableType = getVariableType(variableId, store);

  if (!variableName || !variableType) {
    return () => 'Variable not found';
  }

  return (value: FieldValue, allValues: Record<string, FieldValue>) =>
    isNil(value) ||
    compareVariables(value, allValues[variableId], variableType) >= 0
      ? `Your answer must be less than ${variableName}`
      : undefined;
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
  validation: ReduxFormValidation,
  store: AppStore,
) => {
  const entries = Object.entries(validation) as [
    keyof typeof validations,
    unknown,
  ][];

  entries.map(([type, options]) =>
    Object.hasOwnProperty.call(validations, type)
      ? validations[type](options, store)
      : () => `Validation "${type}" not found`,
  );
};

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

export default validations;
