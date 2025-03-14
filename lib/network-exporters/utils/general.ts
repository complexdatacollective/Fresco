import type {
  Codebook,
  VariablePropertyKey,
  VariablePropertyValue,
} from '@codaco/protocol-validation';
import { caseProperty, sessionProperty } from '@codaco/shared-consts';
import sanitizeFilename from 'sanitize-filename';
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

type BaseParams = {
  codebook: Codebook;
  key: string;
  attributeProperty: VariablePropertyKey;
};

type NodeOrEdgeParams = BaseParams & {
  entity: 'node' | 'edge';
  type: string;
};

type EgoParams = BaseParams & {
  entity: 'ego';
  type?: never;
};

// Combined params type using a union
type GetAttributeParams = NodeOrEdgeParams | EgoParams;

export function getAttributePropertyFromCodebook(
  params: GetAttributeParams,
): VariablePropertyValue {
  const { codebook, entity, key, attributeProperty } = params;

  if (entity === 'ego') {
    const variable = codebook.ego?.variables?.[key];
    return variable?.[attributeProperty as keyof typeof variable];
  }

  const type = params.type;
  const variable = codebook[entity]?.[type]?.variables?.[key];
  return variable?.[attributeProperty as keyof typeof variable];
}
