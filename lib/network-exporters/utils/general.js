import {
  caseProperty,
  entityAttributesProperty,
  sessionProperty
} from '@codaco/shared-consts';
import sanitizeFilename from 'sanitize-filename';


export const getEntityAttributes = (entity) =>
  (entity && entity[entityAttributesProperty]) || {};

const escapeFilePart = (part) => part.replace(/\W/g, '');

export const makeFilename = (prefix, entityName, exportFormat, extension) => {
  let name = prefix;
  if (extension !== `.${exportFormat}`) {
    name += name ? '_' : '';
    name += exportFormat;
  }
  if (entityName) {
    name += `_${escapeFilePart(entityName)}`;
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

/**
 * Generate a filename prefix based on the session in the format:
 * `{caseId}_{sessionId}` 
 */
export const getFilePrefix = (session) => `${sanitizeFilename(session.sessionVariables[caseProperty])}_${session.sessionVariables[sessionProperty]}`;

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