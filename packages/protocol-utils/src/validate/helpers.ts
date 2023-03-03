import { Codebook, VariableDefinition, CodebookNodeTypeDefinition, FilterRule, StageSubject } from "@codaco/shared-consts";
import { get, has } from "@codaco/utils";

interface AjvErrorObject {
  dataPath: string;
  message: string;
  params?: {
    additionalProperty?: string;
    allowedValues?: string;
    allowedValue?: string;
  }
}

// For some error types, AJV returns info separate from message
export const additionalErrorInfo = (errorObj: AjvErrorObject) => {
  if (!errorObj) {
    return undefined;
  }

  if (typeof errorObj === 'object') {
    const params = errorObj.params || {};
    return params.additionalProperty
      || params.allowedValues
      || params.allowedValue;
  }

  if (typeof errorObj === 'string') {
    return errorObj;
  }

  return undefined;
};

// Convert an AJV error object to a string
export const errToString = (errorObj: unknown) => {
  if (typeof errorObj === 'string') {
    return errorObj;
  }

  if (!errorObj || typeof errorObj !== 'object') {
    return '';
  }

  // If the error object has a dataPath, it's an AJV error
  if (errorObj && has(errorObj, 'dataPath')) {
    const dataPath = <string>get(errorObj, 'dataPath', '');
    const message = <string>get(errorObj, 'message', '');
    let str = `${dataPath} ${message}`;
    const addlInfo = additionalErrorInfo(errorObj as AjvErrorObject);
    if (addlInfo) {
      str += ` '${addlInfo}'`;
    }
    return `${str} \n\n`;
  }
};

// Check that if a node has a displayVariable property, that it is defined in the node's variables
export const nodeVarsIncludeDisplayVar = (node: CodebookNodeTypeDefinition) =>
  !node.displayVariable // displayVariable is optional
  || Object.keys(node.variables).some(variableId => variableId === node.displayVariable);

// Return the entity definition for a given rule based on its type
export const getEntityDefinitionFromRule = (rule: FilterRule, codebook: Codebook) => {
  if (rule.type === 'ego') { return codebook.ego; }

  if (rule.type === 'edge' || rule.type === 'alter') {
    // Need to convert 'alter' to 'node' for codebook lookup
    const codebookType = rule.type === 'edge' ? 'edge' : 'node';

    const codebookEntity = codebook[codebookType]; // codebook.node or codebook.edge
    const ruleEntityType = rule.options?.type;

    if (codebookEntity && ruleEntityType) {
      return codebookEntity[ruleEntityType];
    }
  }

  return undefined;
};

export const getVariablesForSubject = (codebook: Codebook, subject: StageSubject) => {
  if (!subject || !codebook) { return {}; }

  if (subject.entity === 'ego') {
    return codebook.ego?.variables || {};
  }

  return codebook[subject.entity]?.[subject.type as keyof object]?.variables || {};
};

// @return a variable's human-readable name, based on its ID
export const getVariableNameFromID = (codebook: Codebook, subject: StageSubject, variableID: string) => {
  // Could be replaced with a brute-force search of all variables?
  const variables = getVariablesForSubject(codebook, subject);
  return variables[variableID]?.name || variableID;
};

// @return the name of the subject type, or false if not found. Used when mapping multiple subjects.
export const getSubjectTypeName = (codebook: Codebook, subject: StageSubject) => {
  if (subject.entity === 'ego') {
    return 'ego';
  }

  return codebook[subject.entity]?.[subject.type].name || false;
};

// @return an array of all variable names from a codebook entity variable list
export const getVariableNames = (registryVariables: Record<string, VariableDefinition>) => Object.values(registryVariables).map(variable => variable.name);

// @return an array of all entity names in the codebook
export const getEntityNames = (codebook: Codebook) => ([
  ...Object.values(codebook.node || {}).map(entity => entity.name),
  ...Object.values(codebook.edge || {}).map(entity => entity.name),
]);

// @return the ID (or other unique prop) which is a duplicate, or undefined
export const duplicateId = (elements: object[], uniqueProp = 'id') => {
  const map: Record<string, unknown> = {};

  const dupe = elements.find((el) => {
    // Check if element is already in map
    if (map[el[uniqueProp as keyof object]]) {
      return true;
    }

    // Push element to map

    map[el[uniqueProp as keyof object]] = true;

    return false;
  });

  return dupe && dupe[uniqueProp as keyof object];
};

// @return the item which is a duplicate, or undefined
export const duplicateInArray = (items: Array<string | false>) => {
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
  getEntityDefinitionFromRule,
  getVariablesForSubject,
  getVariableNameFromID,
  getSubjectTypeName,
  getVariableNames,
  getEntityNames,
  duplicateId,
  duplicateInArray,
};
