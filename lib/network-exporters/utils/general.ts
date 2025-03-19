import type {
  Codebook,
  EdgeDefinitionKeys,
  EgoDefinitionKeys,
  NodeDefinitionKeys,
} from '@codaco/protocol-validation';
import {
  caseProperty,
  entityAttributesProperty,
  type NcEntity,
  sessionProperty,
} from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import sanitizeFilename from 'sanitize-filename';
import type { ExportFormat, SessionWithResequencedIDs } from './types';

export const getEntityAttributes = (entity: NcEntity) =>
  entity?.[entityAttributesProperty] || {};

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

const EXTENSIONS = {
  graphml: '.graphml',
  csv: '.csv',
} as const;

/**
 * Provide the appropriate file extension for the export type
 * @param  {string} formatterType one of the `format`s
 * @return {string}
 */
export const getFileExtension = (formatterType: ExportFormat) => {
  switch (formatterType) {
    case 'graphml':
      return EXTENSIONS.graphml;
    case 'adjacencyMatrix':
    case 'edgeList':
    case 'attributeList':
    case 'ego':
      return EXTENSIONS.csv;
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
 * Get the 'type' of a given variable from the codebook
 * @param {*} codebook
 * @param {*} entity node, edge, or ego
 * @param {*} element entity 'type' (person, place, friend, etc.). not used for ego
 * @param {*} key key within element to select
 * @param {*} variableAttribute property of key to return
 */

// Combined params type using a union
type GetAttributeParams = {
  codebook: Codebook;
  entityType: 'node' | 'edge' | 'ego';
  entityName?: string;
  property?: NodeDefinitionKeys | EdgeDefinitionKeys | EgoDefinitionKeys;
};

export function getAttributePropertyFromCodebook(params: GetAttributeParams) {
  const { codebook, entityType, property } = params;

  if (entityType === 'ego') {
    if (!property) {
      return codebook.ego;
    }

    return get(codebook.ego, property);
  }

  const { entityName } = params;

  if (!entityName) {
    throw new Error('Entity name is required for node or edge');
  }

  const entityDefinitions = get(codebook, entityType);
  const thisEntity = get(entityDefinitions, entityName);

  if (!property) {
    return thisEntity;
  }

  return get(thisEntity, property);
}
