/* eslint-disable no-console */
/* eslint-disable global-require */
import { queue } from 'async';
import { EventEmitter } from 'eventemitter3';
import { groupBy, isEmpty, merge } from 'lodash';
import sanitizeFilename from 'sanitize-filename';
import ProgressMessages from './ProgressMessages';
import { ErrorMessages, ExportError } from './errors/ExportError';
import UserCancelledExport from './errors/UserCancelledExport';
import exportFile from './exportFile';
import {
  insertEgoIntoSessionNetworks,
  partitionNetworkByType,
  resequenceIds,
  unionOfNetworks,
} from './formatters/network';
import archive from './utils/archive';
import {
  ObservableValue,
  getFilePrefix,
  sleep,
  verifySessionVariables,
} from './utils/general';
import { protocolProperty } from '@codaco/shared-consts';

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
  exportCSV: defaultCSVOptions,
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
const getOptions = (exportOptions) => ({
  ...merge(defaultExportOptions, exportOptions),
  ...(exportOptions.exportCSV === true ? { exportCSV: defaultCSVOptions } : {}),
});

/**
 * Interface for all data exports
 */
class FileExportManager {
  constructor(exportOptions = {}) {
    this.exportOptions = getOptions(exportOptions);
    this.events = new EventEmitter();
  }

  on = (...args) => {
    this.events.on(...args);
  };

  emit(event, payload) {
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
  exportSessions(sessions, protocols) {
    const tmpDir = '/tmp'; // https://vercel.com/guides/how-can-i-use-files-in-serverless-functions#using-temporary-storage

    // This queue instance accepts one or more promises and limits their
    // concurrency for better usability in consuming apps
    // https://caolan.github.io/async/v3/docs.html#queue

    // Set concurrency to conservative values for now, based on platform
    const QUEUE_CONCURRENCY = 1;

    const q = queue((task, callback) => {
      task()
        .then((result) => callback(null, result))
        .catch((error) => callback(error));
    }, QUEUE_CONCURRENCY);

    const exportFormats = [
      ...(this.exportOptions.exportGraphML ? ['graphml'] : []),
      ...(this.exportOptions.exportCSV ? ['ego'] : []),
      ...(this.exportOptions.exportCSV.adjacencyMatrix
        ? ['adjacencyMatrix']
        : []),
      ...(this.exportOptions.exportCSV.attributeList ? ['attributeList'] : []),
      ...(this.exportOptions.exportCSV.edgeList ? ['edgeList'] : []),
    ];

    // Cleanup function called by abort method, after fatal errors, and after
    // the export promise resolves.
    const cleanUp = () => {
      q.kill();
    };

    this.emit('begin', ProgressMessages.Begin);

    // Reject if required parameters aren't provided
    if (
      (!sessions && !isEmpty(sessions)) ||
      (!protocols && !isEmpty(protocols))
    ) {
      return Promise.reject(new ExportError(ErrorMessages.MissingParameters));
    }

    // Will resolve with an object containing run() and abort() methods
    return new Promise((resolveExportPromise) => {
      // State variables for this export
      let cancelled = false;
      const succeeded = [];
      const failed = [];

      const consideringCancel = new ObservableValue(false);

      const shouldContinue = () => !cancelled;

      // Main work of the process happens here
      const run = () =>
        new Promise((resolveRun, rejectRun) => {
          // Short delay to give consumer UI time to render
          sleep(1000)(shouldContinue)
            .then(() => {
              this.emit('update', ProgressMessages.Formatting);
              return insertEgoIntoSessionNetworks(sessions);
            })
            // Group sessions by protocol UUID
            .then((sessionsWithResequencedIDs) =>
              groupBy(
                sessionsWithResequencedIDs,
                `sessionVariables.${protocolProperty}`,
              ),
            )
            // Then, process the union option
            .then((sessionsByProtocol) => {
              if (!shouldContinue()) {
                throw new UserCancelledExport();
              }

              if (!this.exportOptions.globalOptions.unifyNetworks) {
                return sessionsByProtocol;
              }

              this.emit('update', ProgressMessages.Merging);
              return unionOfNetworks(sessionsByProtocol);
            })
            // Resequence IDs for this export
            .then((sessionsWithEgo) => resequenceIds(sessionsWithEgo))
            .then((unifiedSessions) => {
              if (!shouldContinue()) {
                throw new UserCancelledExport();
              }

              const promisedExports = [];

              // Create an array of promises representing each session in each export format
              const finishedSessions = [];
              const sessionExportTotal = this.exportOptions.globalOptions
                .unifyNetworks
                ? Object.keys(unifiedSessions).length
                : sessions.length;

              Object.keys(unifiedSessions).forEach((protocolUID) => {
                // Reject if no protocol was provided for this session
                if (!protocols[protocolUID]) {
                  const error = `No protocol was provided for the session. Looked for protocolUID ${protocolUID}`;
                  this.emit('error', error);
                  failed.push(error);
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

                  const protocol = protocols[protocolUID];
                  const prefix = getFilePrefix(
                    session,
                    protocol,
                    this.exportOptions.globalOptions.unifyNetworks,
                  );

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
                                tmpDir,
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
              if (!shouldContinue()) {
                throw new UserCancelledExport();
              }

              // FatalError if there are no sessions to encode and no errors
              if (exportedPaths.length === 0 && failedExports.length === 0) {
                throw new ExportError(ErrorMessages.NothingToExport);
              }

              // If we have no files to encode (but we do have errors), finish
              // the task here so the user can see the errors
              if (exportedPaths.length === 0) {
                this.emit('finished', ProgressMessages.Finished);
                cleanUp();
                resolveRun();
                cancelled = true;
                return Promise.resolve();
              }

              const emitZipProgress = (percent) =>
                this.emit('update', ProgressMessages.ZipProgress(percent));

              // Start the zip process, and attach a callback to the update
              // progress event.
              this.emit('update', ProgressMessages.ZipStart);
              return archive(
                exportedPaths,
                tmpDir,
                sanitizeFilename(
                  this.exportOptions.globalOptions.exportFilename,
                ),
                emitZipProgress,
                shouldContinue,
              );
            })
            .then((zipLocation) => {
              if (!shouldContinue()) {
                throw new UserCancelledExport();
              }

              this.emit('update', ProgressMessages.Saving);
              return zipLocation;
            })
            .then((zipLocation) => {
              if (!shouldContinue()) {
                throw new UserCancelledExport();
              }

              // If the user is considering aborting, don't show the save dialog
              const waitWhileConsideringAbort = () =>
                new Promise((resolve, reject) => {
                  const resolveWhenReady = (value) => {
                    if (!shouldContinue()) {
                      reject();
                    }
                    if (value === false) {
                      resolve();
                    }
                  };

                  // Attach a value change listener to our ObservableProperty
                  consideringCancel.registerListener(resolveWhenReady);

                  // Call test once on first run
                  resolveWhenReady(consideringCancel.value);
                });

              return waitWhileConsideringAbort().then(() =>
                console.log('Finished zip location:', zipLocation),
              );
            })
            .then((saveCancelled) => {
              if (!shouldContinue()) {
                throw new UserCancelledExport();
              }

              if (!saveCancelled) {
                this.emit('finished', ProgressMessages.Finished);
              }

              cleanUp();
              resolveRun();
            })
            .catch((err) => {
              cleanUp();
              // We don't reject if this is an error from user cancelling
              if (!(err instanceof UserCancelledExport)) {
                this.emit('cancelled', ProgressMessages.Cancelled);
                rejectRun(err);
              }
            });
        }); // End run()

      const abort = () => {
        // eslint-disable-next-line no-console
        console.info('Aborting file export.');
        if (!shouldContinue()) {
          // eslint-disable-next-line no-console
          console.warn('This export already aborted. Cancelling abort!');
          return;
        }
        cancelled = true;
      };

      const setConsideringAbort = (value) => {
        consideringCancel.value = value;
      };

      resolveExportPromise({ run, abort, setConsideringAbort });
    });
  }
}

export default FileExportManager;
