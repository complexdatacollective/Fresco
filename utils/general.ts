import type { Codebook } from '@codaco/protocol-validation';
import {
  caseProperty,
  entityAttributesProperty,
  sessionProperty,
  type NcEntity,
} from '@codaco/shared-consts';
import sanitizeFilename from 'sanitize-filename';
import type { ExportFormat, SessionWithResequencedIDs } from './types';

export const getEntityAttributes = (entity: NcEntity) =>
  entity?.[entityAttributesProperty] ?? {};

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
 */
const getVariableInfo = (
  codebook: Codebook,
  entity: 'node' | 'edge',
  type: string,
  key: string,
) => codebook[entity]?.[type]?.variables?.[key];

/**
 * Ego version of getVariableInfo
 */
const getEgoVariableInfo = (codebook: Codebook, key: string) =>
  codebook.ego?.variables?.[key];

/**
 * Retrieve a property of a variable from the codebook. For example, get the
 * "name" of the variable with the key '123' for the node type 'person'.
 *
 * @param {*} codebook
 * @param {*} entity node, edge, or ego
 * @param {*} type entity 'type' (person, place, friend, etc.). not used for ego
 * @param {*} key the key of the variable
 * @param {*} variableAttribute property of the key value to return
 */
export const getCodebookEntityVariableProperty = <T = string>({
  codebook,
  entity,
  type,
  key,
  attributeProperty,
}: {
  codebook: Codebook;
  entity: 'node' | 'edge' | 'ego';
  type?: string;
  key: string;
  attributeProperty: string;
}): T | undefined => {
  const variableInfo =
    entity === 'ego'
      ? getEgoVariableInfo(codebook, key)
      : type && getVariableInfo(codebook, entity, type, key);

  return variableInfo?.[attributeProperty as keyof typeof variableInfo];
};
