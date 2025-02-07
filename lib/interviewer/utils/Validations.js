import { isEqual, isNil, isString } from 'es-toolkit';
import { filter, get, isNumber, some } from 'es-toolkit/compat';
import { entityPrimaryKeyProperty } from '~/lib/shared-consts';
import { getCodebookVariablesForSubjectType } from '../selectors/protocol';
import { getNetworkEntitiesForType } from '../selectors/session';

// Return an array of values given either a collection, an array,
// or a single value
const coerceArray = (value) => {
  if (value instanceof Object) {
    return value.reduce((acc, individual) => [...acc, individual.value], []);
  }
  if (value instanceof Array) {
    return value;
  }
  return [];
};

export const required = (message) => (value) => {
  const isEmptyString = isString(value) && value.length === 0;

  if (isNil(value) || isEmptyString) {
    return message || 'You must answer this question before continuing';
  }

  return undefined;
};

export const requiredAcceptsNull = (message) => (value) => {
  if (isNil(value)) {
    return message || 'You must answer this question before continuing';
  }

  return undefined;
};

export const maxLength = (max) => (value) =>
  value && value.length > max
    ? `Your answer must be ${max} characters or less`
    : undefined;
export const minLength = (min) => (value) =>
  !value || value.length < min
    ? `Your answer must be ${min} characters or more`
    : undefined;
export const minValue = (min) => (value) =>
  isNumber(value) && value < min
    ? `Your answer must be at least ${min}`
    : undefined;
export const maxValue = (max) => (value) =>
  isNumber(value) && value > max
    ? `Your answer must be less than ${max}`
    : undefined;

export const minSelected = (min) => (value) =>
  !value || coerceArray(value).length < min
    ? `You must choose a minimum of ${min} option(s)`
    : undefined;

export const maxSelected = (max) => (value) =>
  value && coerceArray(value).length > max
    ? `You must choose a maximum of ${max} option(s)`
    : undefined;

export const isMatchingValue = (submittedValue, existingValue) => {
  if (submittedValue && existingValue && existingValue instanceof Array) {
    return isEqual(submittedValue.sort(), existingValue.sort());
  }
  if (submittedValue && existingValue && existingValue instanceof Object) {
    return isEqual(submittedValue, existingValue);
  }
  return submittedValue === existingValue;
};

export const isSomeValueMatching = (value, otherNetworkEntities, name) =>
  some(
    otherNetworkEntities,
    (entity) =>
      entity.attributes && isMatchingValue(value, entity.attributes[name]),
  );

export const getOtherNetworkEntities = (entities, entityId) =>
  filter(
    entities,
    (node) => !entityId || node[entityPrimaryKeyProperty] !== entityId,
  );

export const unique = (_, store) => {
  return (value, __, { validationMeta }, name) => {
    const otherNetworkEntities = getOtherNetworkEntities(
      getNetworkEntitiesForType(store.getState()),
      validationMeta?.entityId,
    );

    return isSomeValueMatching(value, otherNetworkEntities, name)
      ? 'Your answer must be unique'
      : undefined;
  };
};

const getVariableName = (variableId, store) => {
  const codebookVariablesForType = getCodebookVariablesForSubjectType(
    store.getState(),
  );
  return get(codebookVariablesForType, [variableId, 'name']);
};

const getVariableType = (variableId, store) => {
  const codebookVariablesForType = getCodebookVariablesForSubjectType(
    store.getState(),
  );
  return get(codebookVariablesForType, [variableId, 'type']);
};

export const differentFrom = (variableId, store) => {
  const variableName = getVariableName(variableId, store);
  return (value, allValues) =>
    isMatchingValue(value, allValues[variableId])
      ? `Your answer must be different from ${variableName}`
      : undefined;
};

export const sameAs = (variableId, store) => {
  const variableName = getVariableName(variableId, store);
  return (value, allValues) =>
    !isMatchingValue(value, allValues[variableId])
      ? `Your answer must be the same as ${variableName}`
      : undefined;
};

const compareVariables = (value1, value2, type) => {
  // check for dates
  if (type === 'datetime') {
    const date1 = new Date(value1);
    const date2 = new Date(value2);
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

  return value1 < value2 ? -1 : 1;
};

export const greaterThanVariable = (variableId, store) => {
  const variableName = getVariableName(variableId, store);
  const variableType = getVariableType(variableId, store);
  return (value, allValues) =>
    isNil(value) ||
    compareVariables(value, allValues[variableId], variableType) <= 0
      ? `Your answer must be greater than ${variableName}`
      : undefined;
};

export const lessThanVariable = (variableId, store) => {
  const variableName = getVariableName(variableId, store);
  const variableType = getVariableType(variableId, store);
  return (value, allValues) =>
    isNil(value) ||
    compareVariables(value, allValues[variableId], variableType) >= 0
      ? `Your answer must be less than ${variableName}`
      : undefined;
};

/**
 * Returns the named validation function, if no matching one is found it returns a validation
 * which will always fail.
 * @param {object} validation The validation object
 * @param {object} store The redux store
 * @returns {function} The validation function
 */
export const getValidation = (validation, store) =>
  Object.entries(validation).map(([type, options]) =>
    Object.hasOwnProperty.call(validations, type)
      ? validations[type](options, store)
      : () => `Validation "${type}" not found`,
  );

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
