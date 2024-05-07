import { queue } from 'async';
import type { InstalledProtocols } from '~/lib/interviewer/store';

export const generateOutputFiles =
  (protocols: InstalledProtocols) => (unifiedSessions) => {
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
      1,
    );

    const promisedExports = [];
    const finishedSessions = []; // array of promises representing each session in each export format

    const sessionExportTotal = this.exportOptions.globalOptions.unifyNetworks
      ? Object.keys(unifiedSessions).length
      : sessions.length;

    Object.keys(unifiedSessions).forEach((protocolUID) => {
      unifiedSessions[protocolUID].forEach((session) => {
        // Skip if sessions don't have required sessionVariables

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
            const partitionedEntity = partitionedNetwork.partitionEntity;
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
                          if (this.exportOptions.globalOptions.unifyNetworks) {
                            Object.values(session.sessionVariables).forEach(
                              (sessionVariables) => {
                                this.emit(
                                  'session-exported',
                                  sessionVariables.sessionId,
                                );
                              },
                            );
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
  };
