import { entityAttributesProperty } from '~/lib/shared-consts';

const allowedVariableName = (value) => {
  if (!/^[a-zA-Z0-9._\-:]+$/.test(value)) {
    return 'Not a valid variable name. Only letters, numbers and the symbols ._-: are supported.';
  }
  return undefined;
};

const getUniqueAttributes = (items) => {
  const uniqueSet = items.reduce((acc, node) => {
    Object.keys(node[entityAttributesProperty]).forEach((key) => acc.add(key));
    return acc;
  }, new Set([]));

  return Array.from(uniqueSet);
};

const getVariableNamesFromNetwork = (network) =>
  ['nodes', 'edges'].flatMap((entity) =>
    getUniqueAttributes(network[entity] || []),
  );

const validateNames = (items = []) => {
  const errors = items.filter(
    (item) => allowedVariableName(item) !== undefined,
  );

  if (errors.length === 0) {
    return false;
  }

  return `Variable name not allowed ("${errors.join(
    '", "',
  )}"). Only letters, numbers and the symbols ._-: are supported.`;
};

export default {
  validateNames,
  getVariableNamesFromNetwork,
};
