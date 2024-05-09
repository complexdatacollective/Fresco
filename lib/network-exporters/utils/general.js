import sanitizeFilename from 'sanitize-filename';
import { ExportError, ErrorMessages } from '../errors/ExportError';
import {
  caseProperty,
  codebookHashProperty,
  entityAttributesProperty,
  protocolProperty,
  sessionExportTimeProperty,
  sessionProperty,
} from '@codaco/shared-consts';

// Session vars should match https://github.com/codaco/graphml-schemas/blob/master/xmlns/1.0/graphml%2Bnetcanvas.xsd
export const verifySessionVariables = (sessionVariables) => {
  if (
    !sessionVariables[caseProperty] ||
    !sessionVariables[sessionProperty] ||
    !sessionVariables[protocolProperty] ||
    !sessionVariables[sessionExportTimeProperty] ||
    !sessionVariables[codebookHashProperty]
  ) {
    throw new ExportError(ErrorMessages.MissingParameters);
  }

  return true;
};

export const getEntityAttributes = (entity) =>
  (entity && entity[entityAttributesProperty]) || {};

const escapeFilePart = (part) => part.replace(/\W/g, '');

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
