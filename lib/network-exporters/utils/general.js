import sanitizeFilename from 'sanitize-filename';
import {
  VariableType,
  caseProperty,
  entityAttributesProperty,
  sessionProperty,
} from '@codaco/shared-consts';


export const getEntityAttributes = (entity) =>
  (entity && entity[entityAttributesProperty]) || {};

const escapeFilePart = (part) => part.replace(/\W/g, '');

export const sleep =
  (time = 2000) =>
    (passThrough) =>
      new Promise((resolve) => setTimeout(() => resolve(passThrough), time));

export const makeFilename = (prefix, entityType, exportFormat, extension) => {
  let name = prefix;
  if (extension !== `.${exportFormat}`) {
    name += name ? '_' : '';
    name += exportFormat;
  }
  if (entityType) {
    name += `_${escapeFilePart(entityType)}`;
  }
  return `${name}${extension}`;
};

const extensions = {
  graphml: '.graphml',
  csv: '.csv',
};

/**
 * Provide the appropriate file extension for the export type
 * @param  {string} formatterType one of the `format`s
 * @return {string}
 */
export const getFileExtension = (formatterType) => {
  switch (formatterType) {
    case 'graphml':
      return extensions.graphml;
    case 'adjacencyMatrix':
    case 'edgeList':
    case 'attributeList':
    case 'ego':
      return extensions.csv;
    default:
      return null;
  }
};

// Determine filename prefix based on if we are exporting a single session
// or a unified network
export const getFilePrefix = (session, protocol, unifyNetworks) => {
  if (unifyNetworks) {
    return sanitizeFilename(protocol.name);
  }

  return `${sanitizeFilename(session.sessionVariables[caseProperty])}_${session.sessionVariables[sessionProperty]
    }`;
};


const VariableTypeValues = Object.freeze(Object.values(VariableType));

/**
 * Given a codebook, an entity type, an entity, and an attribute key:
 * retrieve the key value from the entity, via the codebook.
 * @param {*} codebook
 * @param {*} type
 * @param {*} entity
 * @param {*} key
 */
export const getVariableInfo = (codebook, type, entity, key) =>
  codebook[type] &&
  codebook[type][entity.type] &&
  codebook[type][entity.type].variables &&
  codebook[type][entity.type].variables[key];

/**
 * Ego version of getVariableInfo
 * @param {*} codebook
 * @param {*} type
 * @param {*} key
 */
export const getEgoVariableInfo = (codebook, key) =>
  codebook.ego && codebook.ego.variables && codebook.ego.variables[key];

/**
 * Determine if a given variable is one of the valid NC vattribute types
 * @param {*} codebook
 * @param {*} type
 * @param {*} element
 * @param {*} key
 */
export const codebookExists = (codebook, type, element, key) => {
  const variableInfo = getVariableInfo(codebook, type, element, key);
  return (
    variableInfo &&
    variableInfo.type &&
    VariableTypeValues.includes(variableInfo.type)
  );
};

/**
 * Get the 'type' of a given variable from the codebook
 * @param {*} codebook
 * @param {*} type node, edge, or ego
 * @param {*} element entity 'type' (person, place, friend, etc.). not used for ego
 * @param {*} key key within element to select
 * @param {*} variableAttribute property of key to return
 */
export const getAttributePropertyFromCodebook = (
  codebook,
  type,
  element,
  key,
  attributeProperty = 'type',
) => {
  if (type === 'ego') {
    const variableInfo = getEgoVariableInfo(codebook, key);
    return variableInfo && variableInfo[attributeProperty];
  }
  const variableInfo = getVariableInfo(codebook, type, element, key);
  return variableInfo && variableInfo[attributeProperty];
};
