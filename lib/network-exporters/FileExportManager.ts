import { protocolProperty } from '@codaco/shared-consts';
import { queue, seq } from 'async';
import { EventEmitter } from 'eventemitter3';
import { groupBy, isEmpty, merge } from 'lodash';
import os from 'node:os';
import sanitizeFilename from 'sanitize-filename';
import {
  ProgressMessages,
  ExportEventTypes,
  ProgressMessage,
} from './ProgressMessages';
import { ErrorMessages, ExportError } from './errors/ExportError';
import exportFile from './exportFile';
import {
  insertEgoIntoSessionNetworks,
  partitionNetworkByType,
  resequenceIds,
  unionOfNetworks,
} from './formatters/network';
import archive from './utils/archive';
import { getFilePrefix, verifySessionVariables } from './utils/general';
import { uploadZipToUploadThing } from './utils/uploadZipToUploadThing';
import { ExportOptions, ExportResult } from './utils/exportOptionsSchema';
import TypedEventEmitter from './utils/TypedEventEmitter';
import { FormattedSessions } from './formatters/session/formatExportableSessions';
import { InstalledProtocols } from '../interviewer/store';

const defaultCSVOptions = {
  adjacencyMatrix: false,
  attributeList: true,
  edgeList: true,
  // If CSV is exported, egoAttributeList must be exported
  // as it contains session info so this option is generally
  // ignored and only relevant for *only* exporting
  // egoAttributeList
  egoAttributeList: true,
};

const defaultExportOptions = {
  exportGraphML: true,
  exportCSV: true,
  globalOptions: {
    exportFilename: 'networkCanvasExport',
    unifyNetworks: false,
    useDirectedEdges: false, // TODO
    useScreenLayoutCoordinates: true,
    screenLayoutHeight: 1080,
    screenLayoutWidth: 1920,
  },
};

// Merge default and user-supplied options
const getOptions = (exportOptions?: ExportOptions): ExportOptions =>
  merge(defaultExportOptions, exportOptions);

// Set concurrency to conservative values for now, based on platform
const QUEUE_CONCURRENCY = 1;

class FileExportManager {
  private exportOptions: ExportOptions;
  private events = new TypedEventEmitter<ExportEventTypes>();

  constructor(exportOptions?: ExportOptions) {
    this.exportOptions = getOptions(exportOptions);
  }

  on(
    event: keyof ExportEventTypes,
    listener: (...args: ExportEventTypes[keyof ExportEventTypes]) => void,
  ) {
    if (!event) {
      // eslint-disable-next-line no-console
      console.warn('Malformed on.');
      return;
    }

    this.events.on(event, listener);
  }

  emit(event: keyof ExportEventTypes, payload: ProgressMessage) {
    if (!event) {
      // eslint-disable-next-line no-console
      console.warn('Malformed emit.');
      return;
    }

    this.events.emit(event, payload);
  }

  removeAllListeners = () => {
    this.events.removeAllListeners();
  };

  /**
   * Main export method. Returns a promise that resolves an to an object
   * containing an object with run() and abort() methods that control the task.
   *
   * Rejections from this method are fatal errors, but errors within
   * the run() task only fail that specific task.
   *
   * @param {*} sessions    collection of session objects
   * @param {*} protocols   object keyed by protocolUID (SHA of protocol.name), where each
   *                        protocols[protocolUID] is a complete protocol object,
   *                        including codebook. Must contain a key for every session
   *                        protocol in the sessions collection.
   */
  exportSessions(
    sessions: FormattedSessions,
    protocols: InstalledProtocols,
  ): Promise<ExportResult> {
    // https://vercel.com/guides/how-can-i-use-files-in-serverless-functions#using-temporary-storage
    const temporaryDirectory = os.tmpdir();

    // This queue instance accepts one or more promises and limits their
    // concurrency for better usability in consuming apps
    // https://caolan.github.io/async/v3/docs.html#queue
    const q = queue(
      (
        task: () => Promise<unknown>,
        callback: (error: Error | null, result?: unknown) => void,
      ) => {
        task()
          .then((result) => callback(null, result))
          .catch((error: Error) => callback(error));
      },
      QUEUE_CONCURRENCY,
    );

    this.emit('begin', ProgressMessages.Begin);

    // Reject if required parameters aren't provided
    if (
      (!sessions && !isEmpty(sessions)) ||
      (!protocols && !isEmpty(protocols))
    ) {
      throw new ExportError(ErrorMessages.MissingParameters);
    }

    const succeeded: string[] = [];
    const failed: Record<string, string> = {};

    this.emit('update', ProgressMessages.Formatting);

    const process = seq(
      insertEgoIntoSessionNetworks,
      (s: unknown) => groupBy(s, `sessionVariables.${protocolProperty}`),
      (s: unknown) => {
        if (!this.exportOptions.globalOptions.unifyNetworks) {
          return s;
        }

        this.emit('update', ProgressMessages.Merging);
        return unionOfNetworks(s);
      },
      resequenceIds,
    );

    process(sessions);

    // Main work of the process happens here
    return new Promise((resolveRun, rejectRun) => {
      // Short delay to give consumer UI time to render
      this.emit('update', ProgressMessages.Formatting);
      return (
        Promise.resolve(insertEgoIntoSessionNetworks(sessions))
          // Group sessions by protocol UUID
          .then((sessionsWithResequencedIDs) =>
            groupBy(
              sessionsWithResequencedIDs,
              `sessionVariables.${protocolProperty}`,
            ),
          )
          // Then, process the union option
          .then((sessionsByProtocol) => {
            if (!this.exportOptions.globalOptions.unifyNetworks) {
              return sessionsByProtocol;
            }

            this.emit('update', ProgressMessages.Merging);
            return unionOfNetworks(sessionsByProtocol);
          })
          // Resequence IDs for this export
          .then((sessionsWithEgo) => resequenceIds(sessionsWithEgo))
          .then((unifiedSessions) => {
            const promisedExports: Array<() => Promise<void>> = [];
            const finishedSessions: Array<Promise<unknown>> = []; // array of promises representing each session in each export format

            const sessionExportTotal = this.exportOptions.globalOptions
              .unifyNetworks
              ? Object.keys(unifiedSessions).length
              : sessions.length;

            Object.keys(unifiedSessions).forEach((protocolUID) => {
              // Reject if no protocol was provided for this session
              if (!protocols[protocolUID]) {
                const error = `No protocol was provided for the session. Looked for protocolUID ${protocolUID}`;
                failed[protocolUID] = error;
                return;
              }

              unifiedSessions[protocolUID].forEach((session) => {
                // Skip if sessions don't have required sessionVariables
                try {
                  if (this.exportOptions.globalOptions.unifyNetworks) {
                    Object.values(session.sessionVariables).forEach(
                      (sessionVariables) => {
                        verifySessionVariables(sessionVariables);
                      },
                    );
                  } else {
                    verifySessionVariables(session.sessionVariables);
                  }
                } catch (e) {
                  failed.push(e);
                  return;
                }

                const protocol = protocols[protocolUID]!;
                const prefix = getFilePrefix(
                  session,
                  protocol,
                  this.exportOptions.globalOptions.unifyNetworks,
                );

                const exportFormats = [
                  ...(this.exportOptions.exportGraphML ? ['graphml'] : []),
                  ...(this.exportOptions.exportCSV
                    ? ['attributeList', 'edgeList', 'ego']
                    : []),
                ];

                // Returns promise resolving to filePath for each format exported
                exportFormats.forEach((format) => {
                  // Partitioning the network based on node and edge type so we can create
                  // an individual export file for each type
                  const partitionedNetworks = partitionNetworkByType(
                    protocol.codebook,
                    session,
                    format,
                  );

                  partitionedNetworks.forEach((partitionedNetwork) => {
                    const partitionedEntity =
                      partitionedNetwork.partitionEntity;
                    promisedExports.push(
                      () =>
                        new Promise((resolve, reject) => {
                          try {
                            exportFile(
                              prefix,
                              partitionedEntity,
                              format,
                              temporaryDirectory,
                              partitionedNetwork,
                              protocol.codebook,
                              this.exportOptions,
                            )
                              .then((result) => {
                                if (!finishedSessions.includes(prefix)) {
                                  // If we unified the networks, we need to iterate sessionVariables and
                                  // emit a 'session-exported' event for each sessionID
                                  if (
                                    this.exportOptions.globalOptions
                                      .unifyNetworks
                                  ) {
                                    Object.values(
                                      session.sessionVariables,
                                    ).forEach((sessionVariables) => {
                                      this.emit(
                                        'session-exported',
                                        sessionVariables.sessionId,
                                      );
                                    });
                                  } else {
                                    this.emit(
                                      'session-exported',
                                      session.sessionVariables.sessionId,
                                    );
                                  }

                                  this.emit(
                                    'update',
                                    ProgressMessages.ExportSession(
                                      finishedSessions.length + 1,
                                      sessionExportTotal,
                                    ),
                                  );
                                  finishedSessions.push(prefix);
                                }
                                resolve(result);
                              })
                              .catch((e) => reject(e));
                          } catch (error) {
                            this.emit(
                              'error',
                              `Encoding ${prefix} failed: ${error.message}`,
                            );
                            this.emit(
                              'update',
                              ProgressMessages.ExportSession(
                                finishedSessions.length + 1,
                                sessionExportTotal,
                              ),
                            );
                            reject(error);
                          }
                        }),
                    );
                  });
                });
              });
            });

            q.push(promisedExports, (err, result) => {
              if (err) {
                failed.push(err);
                return;
              }
              succeeded.push(result);
            });

            return new Promise((resolve, reject) =>
              q
                .drain()
                .then(() =>
                  resolve({
                    exportedPaths: succeeded,
                    failedExports: failed,
                  }),
                )
                .catch(reject),
            );
          })
          // Then, Zip the result.
          .then(({ exportedPaths, failedExports }) => {
            // FatalError if there are no sessions to encode and no errors
            if (exportedPaths.length === 0 && failedExports.length === 0) {
              throw new ExportError(ErrorMessages.NothingToExport);
            }

            // If we have no files to encode (but we do have errors), reject
            // the task with errors
            if (exportedPaths.length === 0) {
              const errorMsg = 'No files to add to zip file!';
              this.emit('error', errorMsg);
              q.kill();
              rejectRun({
                data: null,
                error: errorMsg,
              });
              return Promise.reject();
            }

            const emitZipProgress = (percent) =>
              this.emit('update', ProgressMessages.ZipProgress(percent));

            // Start the zip process, and attach a callback to the update
            // progress event.
            this.emit('update', ProgressMessages.ZipStart);
            return archive(
              exportedPaths,
              temporaryDirectory,
              sanitizeFilename(this.exportOptions.globalOptions.exportFilename),
              emitZipProgress,
            );
          })
          .then((zipLocation) => {
            this.emit('update', ProgressMessages.Saving);
            return zipLocation;
          })
          .then(async (zipLocation) => {
            const zipFileName = sanitizeFilename(
              this.exportOptions.globalOptions.exportFilename,
            );

            const result = await uploadZipToUploadThing(
              zipLocation,
              zipFileName,
            );

            return result;
          })
          .then((result) => {
            if (result.data) {
              this.emit('finished', ProgressMessages.Finished);
              resolveRun({ ...result });
            } else {
              this.emit('error', result.message);
              rejectRun({
                data: null,
                error: result.error,
              });
            }

            q.kill();
          })
          .catch((_err) => {
            q.kill();
            this.emit('error', ProgressMessages.Cancelled);
            rejectRun({
              data: null,
              error: ProgressMessages.Cancelled,
            });
          })
      );
    });
  }
}

export default FileExportManager;
