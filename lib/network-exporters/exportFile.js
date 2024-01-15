/* eslint-disable global-require */
import path from 'path';
import { ExportError } from './errors/ExportError';
import UserCancelledExport from './errors/UserCancelledExport';
import { getFileExtension, makeFilename } from './utils/general';
import getFormatterClass from './utils/getFormatterClass';
import fs from 'node:fs';

/**
 * Export a single (CSV or graphml) file
 * @param  {string}   namePrefix used to construct the filename
 * @param  {string}   partitionedEntityName an entity name used by CSV formatters
 * @param  {formats}  exportFormat a special config object that specifies the formatter class
 * @param  {string}   outDir directory where we should write the file
 * @param  {object}   network NC-formatted network `({ nodes, edges, ego })`
 * @param  {Object}   codebook needed to lookup variable types for encoding
 * @param  {Object}   exportOptions the new style configuration object, passed through to
 *                    the formatter
 * @return {Promise}  promise decorated with an `abort` method.
 *                    If aborted, the returned promise will never settle.
 * @private
 */
const exportFile = (
  namePrefix,
  partitonedEntityName,
  exportFormat,
  outDir,
  network,
  codebook,
  exportOptions,
) => {
  const Formatter = getFormatterClass(exportFormat);
  const extension = getFileExtension(exportFormat);

  if (!Formatter || !extension) {
    return Promise.reject(
      new ExportError(`Invalid export format ${exportFormat}`),
    );
  }

  // Establish variables to hold the stream controller (needed to handle abort method)
  // and the stream itself.
  let streamController;
  let writeStream;
  let promiseResolve;
  let promiseReject;

  // Create a promise
  const pathPromise = new Promise((resolve, reject) => {
    promiseResolve = resolve;
    promiseReject = reject;

    const formatter = new Formatter(network, codebook, exportOptions);
    const outputName = makeFilename(
      namePrefix,
      partitonedEntityName,
      exportFormat,
      extension,
    );

    const filePath = path.join(outDir, outputName);

    const writeStream = fs.createWriteStream(filePath);

    writeStream.on('finish', () => {
      promiseResolve(filePath);
    });
    writeStream.on('error', (err) => {
      console.log('CAME HERE:', err);
      promiseReject(err);
    });

    streamController = formatter.writeToStream(writeStream);
  });

  // Decorate the promise with an abort method that also tears down the
  // streamController and the writeStream
  pathPromise.abort = () => {
    if (streamController) {
      streamController.abort();
    }
    if (writeStream) {
      writeStream.destroy();
    }

    promiseReject(new UserCancelledExport());
  };

  return pathPromise;
};

export default exportFile;
