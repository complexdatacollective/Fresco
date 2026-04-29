import { caseProperty, sessionProperty } from '@codaco/shared-consts';
import { isNil } from 'es-toolkit';
import sanitizeFilename from 'sanitize-filename';
import type { ExportFormat } from '../options';
import type { SessionWithResequencedIDs } from '../input';

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
 * Check if an option value is selected in the categorical attribute data.
 * Uses strict equality matching to avoid substring matching bugs.
 *
 * @param attributeData - The categorical attribute value (array or single value)
 * @param optionValue - The option value to check for
 * @returns true if the option is selected, false otherwise
 */
export const isCategoricalOptionSelected = (
  attributeData: unknown,
  optionValue: string | number | boolean,
): boolean => {
  // isNil, not `!attributeData`: a stored `0` / `false` is a valid option
  // value that must reach the equality / includes checks below.
  if (isNil(attributeData)) {
    return false;
  }

  if (Array.isArray(attributeData)) {
    return attributeData.includes(optionValue);
  }

  return attributeData === optionValue;
};
