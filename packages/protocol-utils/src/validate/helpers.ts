import { Codebook, Form, CodebookNodeTypeDefinition, FilterRule } from "@codaco/shared-consts";

// For some error types, AJV returns info separate from message
export const additionalErrorInfo = (errorObj: any) => {
  const params = errorObj.params || {};
  return params.additionalProperty
    || params.allowedValues
    || params.allowedValue;
};

// Convert an AJV error object to a string
export const errToString = (errorObj: any) => {
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

// Check that if a node has a displayVariable property, that it is defined in the node's variables
export const nodeVarsIncludeDisplayVar = (node: CodebookNodeTypeDefinition) =>
  !node.displayVariable // displayVariable is optional
  || Object.keys(node.variables).some(variableId => variableId === node.displayVariable);

// Return the entity definition for a given rule based on its type
export const entityDefFromRule = (rule: FilterRule, codebook: Codebook) => {
  if (rule.type === 'ego') { return codebook.ego; } // Ego is always defined
  if (rule.type === 'edge' || rule.type === 'node') {
    const codebookEntity = codebook[rule.type];
    const ruleEntityType = rule.options?.type;

    if (codebookEntity && ruleEntityType) {
      return codebookEntity[ruleEntityType];
    }
  }

  return false;
};

export const getVariablesForSubject = (codebook: Codebook, subject: Sta) => {
  if (subject && subject.entity === 'ego') {
    return get(codebook, ['ego', 'variables'], {});
  }

  return get(codebook, [subject.entity, subject.type, 'variables'], {});
};

export const getVariableNameFromID = (codebook, subject, variableID) => {
  const variables = getVariablesForSubject(codebook, subject);
  return get(variables, [variableID, 'name'], variableID);
};

export const getSubjectTypeName = (codebook, subject) => {
  if (!subject) { return 'entity'; }

  if (subject.entity === 'ego') {
    return 'ego';
  }

  return get(codebook, [subject.entity, subject.type, 'name'], subject.type);
};

export const getVariableNames = registryVars => Object.values(registryVars).map(vari => vari.name);

export const getEntityNames = registryVars => ([
  ...Object.values(registryVars.node || {}).map(vari => vari.name),
  ...Object.values(registryVars.edge || {}).map(vari => vari.name),
]);

// @return the ID (or other unique prop) which is a duplicate, undefined otherwise
export const duplicateId = (elements, uniqueProp = 'id') => {
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
export const duplicateInArray = (items) => {
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

export default {
  additionalErrorInfo,
  errToString,
  nodeVarsIncludeDisplayVar,
  entityDefFromRule,
  getVariablesForSubject,
  getVariableNameFromID,
  getSubjectTypeName,
  getVariableNames,
  getEntityNames,
  duplicateId,
  duplicateInArray,
};
