import { first } from 'lodash';
import sanitizeFilename from 'sanitize-filename';
import { ExportError, ErrorMessages } from '../errors/ExportError';
import { isCordova, isElectron } from './Environment';
import { copy } from './filesystem';
import {
  caseProperty,
  sessionProperty,
  protocolProperty,
  entityAttributesProperty,
  sessionExportTimeProperty,
  codebookHashProperty,
} from './reservedAttributes';
import dynamic from 'next/dynamic';

// Session vars should match https://github.com/codaco/graphml-schemas/blob/master/xmlns/1.0/graphml%2Bnetcanvas.xsd
const verifySessionVariables = (sessionVariables) => {
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

const getEntityAttributes = (entity) =>
  (entity && entity[entityAttributesProperty]) || {};

const escapeFilePart = (part) => part.replace(/\W/g, '');

const sleep =
  (time = 2000) =>
  (passThrough) =>
    new Promise((resolve) => setTimeout(() => resolve(passThrough), time));

// Utility method for use during testing.
const randomFail = (passThrough) =>
  new Promise((resolve, reject) => {
    if (Math.random() >= 0.5) {
      reject(new Error('Error happened!'));
    }

    resolve(passThrough);
  });

const makeFilename = (prefix, entityType, exportFormat, extension) => {
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
const getFileExtension = (formatterType) => {
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
const getFilePrefix = (session, protocol, unifyNetworks) => {
  if (unifyNetworks) {
    return sanitizeFilename(protocol.name);
  }

  return `${sanitizeFilename(session.sessionVariables[caseProperty])}_${
    session.sessionVariables[sessionProperty]
  }`;
};

const extensionPattern = new RegExp(`${Object.values(extensions).join('|')}$`);

// Todo: check if it does the job
const handlePlatformSaveDialog = (zipLocation, filename) =>
  new Promise((resolve, reject) => {
    if (!zipLocation) {
      reject();
    }

    const fs = dynamic(() => import('fs-extra'));
    const path = dynamic(() => import('path'));

    const destinationPath = path.resolve(zipLocation, '..', filename);

    fs.copy(zipLocation, destinationPath)
      .then(() => {
        // eslint-disable-next-line no-console
        console.log(`File copied to: ${destinationPath}`);
        resolve();
      })
      .catch(reject);
  });

// The idea behind this is to allow for an event listener to be attached to
// an object property which fires when it changes.
class ObservableValue {
  constructor(value) {
    this.valueInternal = value;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.valueListener = () => {};
  }

  set value(val) {
    this.valueInternal = val;
    this.valueListener(val);
  }

  get value() {
    return this.valueInternal;
  }

  registerListener(listener) {
    this.valueListener = listener;
  }
}

export {
  escapeFilePart,
  extensionPattern,
  extensions,
  getEntityAttributes,
  getFileExtension,
  getFilePrefix,
  makeFilename,
  verifySessionVariables,
  sleep,
  randomFail,
  handlePlatformSaveDialog,
  ObservableValue,
};
