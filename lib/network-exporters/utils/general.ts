import sanitizeFilename from 'sanitize-filename';
import {
  caseProperty,
  sessionProperty,
  type Codebook,
  type StageSubject,
} from '~/lib/shared-consts';
import type { ExportFormat, SessionWithResequencedIDs } from './types';

const escapeFilePart = (part: string) => part.replace(/\W/g, '');

export const makeFilename = (
  prefix: string,
  entityName: string | undefined,
  exportFormat: string,
  extension: string,
) => {
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

export const getFileExtension = (formatterType: ExportFormat) => {
  switch (formatterType) {
    case 'graphml':
      return extensions.graphml;
    case 'adjacencyMatrix':
    case 'edgeList':
    case 'attributeList':
    case 'ego':
      return extensions.csv;
  }
};

/**
 * Generate a filename prefix based on the session in the format:
 * `{caseId}_{sessionId}`
 */
export const getFilePrefix = (session: SessionWithResequencedIDs) =>
  sanitizeFilename(
    `${session.sessionVariables[caseProperty]}_${session.sessionVariables[sessionProperty]}`,
  );

/**
 * Given a codebook, an entity type, an entity, and an attribute key:
 * retrieve the key value from the entity, via the codebook.
 * @param {*} codebook
 * @param {*} type
 * @param {*} entity
 * @param {*} key
 */
const getVariableInfo = (
  codebook: Codebook,
  type: 'node' | 'edge',
  entity: StageSubject,
  key: string,
) => codebook[type]?.[entity.type]?.variables?.[key];

/**
 * Ego version of getVariableInfo
 * @param {*} codebook
 * @param {*} type
 * @param {*} key
 */
const getEgoVariableInfo = (codebook: Codebook, key: string) =>
  codebook.ego?.variables?.[key];

/**
 * Get the 'type' of a given variable from the codebook
 * @param {*} codebook
 * @param {*} type node, edge, or ego
 * @param {*} element entity 'type' (person, place, friend, etc.). not used for ego
 * @param {*} key key within element to select
 * @param {*} variableAttribute property of key to return
 */
export const getAttributePropertyFromCodebook = (
  codebook: Codebook,
  type: 'node' | 'edge' | 'ego',
  element: StageSubject,
  key: string,
  attributeProperty = 'type',
) => {
  let variableInfo;
  if (type === 'ego') {
    variableInfo = getEgoVariableInfo(codebook, key);
  } else {
    variableInfo = getVariableInfo(codebook, type, element, key);
  }
  return variableInfo?.[attributeProperty as keyof typeof variableInfo];
};
