const get = require('lodash').get;

// For some error types, AJV returns info separate from message
const additionalErrorInfo = (errorObj) => {
  const params = errorObj.params || {};
  return params.additionalProperty
    || params.allowedValues
    || params.allowedValue;
};

const errToString = (errorObj) => {
  if (typeof errorObj === 'string') {
    return errorObj;
  }
  let str = `${errorObj.dataPath} ${errorObj.message}`;
  const addlInfo = additionalErrorInfo(errorObj);
  if (addlInfo) {
    str += ` '${addlInfo}'`;
  }
  return `${str} \n\n`;
};

const undefinedFormVariables = (form, codebook) =>
  form.fields
    .map(f => f.variable)
    .filter(variable => !codebook[form.entity][form.type].variables[variable]);

const nodeVarsIncludeDisplayVar = node =>
  !node.displayVariable // displayVariable is optional
    || Object.keys(node.variables).some(variableId => variableId === node.displayVariable);

const entityDefFromRule = (rule, codebook) => {
  if (rule.type === 'ego') { return codebook.ego; } // Ego is always defined
  return codebook[rule.type === 'edge' ? 'edge' : 'node'][rule.options.type];
};

const getVariablesForSubject = (codebook, subject) => {
  if (subject && subject.entity === 'ego') {
    return get(codebook, ['ego', 'variables'], {});
  }

  return get(codebook, [subject.entity, subject.type, 'variables'], {});
};

const getVariableNameFromID = (codebook, subject, variableID) => {
  const variables = getVariablesForSubject(codebook, subject);
  return get(variables, [variableID, 'name'], variableID);
};

const getSubjectTypeName = (codebook, subject) => {
  if (!subject) { return 'entity'; }

  if (subject.entity === 'ego') {
    return 'ego';
  }

  return get(codebook, [subject.entity, subject.type, 'name'], subject.type);
};

const getVariableNames = registryVars => Object.values(registryVars).map(vari => vari.name);

const getEntityNames = registryVars => ([
  ...Object.values(registryVars.node || {}).map(vari => vari.name),
  ...Object.values(registryVars.edge || {}).map(vari => vari.name),
]);

// @return the ID (or other unique prop) which is a duplicate, undefined otherwise
const duplicateId = (elements, uniqueProp = 'id') => {
  const map = {};
  const dupe = elements.find((el) => {
    if (map[el[uniqueProp]]) {
      return true;
    }
    map[el[uniqueProp]] = 1;
    return false;
  });
  return dupe && dupe[uniqueProp];
};

// @return the item which is a duplicate, undefined otherwise
const duplicateInArray = (items) => {
  const set = new Set();
  const dupe = items.find((item) => {
    if (set.has(item)) {
      return true;
    }
    set.add(item);
    return false;
  });
  return dupe;
};

module.exports = {
  duplicateId,
  duplicateInArray,
  entityDefFromRule,
  errToString,
  getVariablesForSubject,
  getVariableNameFromID,
  getVariableNames,
  getSubjectTypeName,
  getEntityNames,
  nodeVarsIncludeDisplayVar,
  undefinedFormVariables,
};
