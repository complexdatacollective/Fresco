/* eslint-disable global-require */
const { first, zip } = require('lodash');
const sanitizeFilename = require('sanitize-filename');
const { ExportError, ErrorMessages } = require('../errors/ExportError');
const { isCordova, isElectron } = require('./Environment');
const { copy } = require('./filesystem');
const {
  caseProperty,
  sessionProperty,
  protocolProperty,
  entityAttributesProperty,
  sessionExportTimeProperty,
  codebookHashProperty,
} = require('./reservedAttributes');

// Session vars should match https://github.com/codaco/graphml-schemas/blob/master/xmlns/1.0/graphml%2Bnetcanvas.xsd
const verifySessionVariables = (sessionVariables) => {
  if (
    !sessionVariables[caseProperty]
    || !sessionVariables[sessionProperty]
    || !sessionVariables[protocolProperty]
    || !sessionVariables[sessionExportTimeProperty]
    || !sessionVariables[codebookHashProperty]
  ) {
    throw new ExportError(ErrorMessages.MissingParameters);
  }

  return true;
};

const getEntityAttributes = (entity) => (entity && entity[entityAttributesProperty]) || {};

const escapeFilePart = (part) => part.replace(/\W/g, '');

const sleep = (time = 2000) => (passThrough) => (
  new Promise((resolve) => setTimeout(() => resolve(passThrough), time))
);

// Utility method for use during testing.
const randomFail = (passThrough) => new Promise((resolve, reject) => {
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

  return `${sanitizeFilename(session.sessionVariables[caseProperty])}_${session.sessionVariables[sessionProperty]}`;
};

const extensionPattern = new RegExp(`${Object.values(extensions).join('|')}$`);

const handlePlatformSaveDialog = (zipLocation, filename) => new Promise((resolve, reject) => {
  if (!zipLocation) {
    reject();
  }
  if (isElectron()) {
    let electron;

    if (typeof window !== 'undefined' && window) {
      electron = window.require('electron').remote;
    } else {
      // if no window object assume we are in nodejs environment (Electron main)
      // no remote needed
      electron = require('electron');
    }

    const { dialog } = electron;
    const browserWindow = first(electron.BrowserWindow.getAllWindows());

    dialog.showSaveDialog(
      browserWindow,
      {
        filters: [{ name: 'zip', extensions: ['zip'] }],
        defaultPath: filename,
      },
    )
      .then(({ canceled, filePath }) => {
        if (canceled) {
          resolve(true);
        }

        copy(zipLocation, filePath)
          .then(() => {
            const { shell } = electron;
            shell.showItemInFolder(filePath);
            resolve();
          })
          .catch(reject);
      });
  }

  if (isCordova()) {
    window.plugins.socialsharing.shareWithOptions({
      message: 'Your zipped network canvas data.', // not supported on some apps
      // subject: 'network canvas export',
      files: [zipLocation],
      chooserTitle: 'Share zip file via', // Android only
    }, resolve, reject);
  }
});

// The idea behind this is to allow for an event listener to be attached to
// an object property which fires when it changes.
class ObservableValue {
  constructor(value) {
    this.valueInternal = value;
    this.valueListener = () => { };
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

module.exports = {
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
