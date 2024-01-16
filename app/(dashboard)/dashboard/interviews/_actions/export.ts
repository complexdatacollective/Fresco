/* eslint-disable no-console */
'use server';

import FileExportManager from '~/lib/network-exporters/FileExportManager';
import { api } from '~/trpc/server';
import { formatExportableSessions, getRemoteProtocolID } from './utils';

type UpdateItems = {
  statusText: string;
  progress: number;
};

export const exportSessions = async () => {
  const interviewsSessions = await api.interview.get.all.query();
  const installedProtocols = await api.protocol.get.all.query();

  let resultData;
  let error;

  const fileExportManager = new FileExportManager();

  fileExportManager.on('begin', () => {
    console.log({
      statusText: 'Starting export...',
      percentProgress: 0,
    });
  });

  fileExportManager.on('update', ({ statusText, progress }: UpdateItems) => {
    console.log({
      statusText,
      percentProgress: progress,
    });
  });

  fileExportManager.on('cancelled', () => {
    console.log('showCancellationToast');
  });

  fileExportManager.on('session-exported', (sessionId: string) => {
    if (!sessionId || typeof sessionId !== 'string') {
      console.warn('session-exported event did not contain a sessionID');
      error = 'session-exported event did not contain a sessionID';
    }
    console.log('session-exported success');
  });

  fileExportManager.on('error', (err: unknown) => {
    console.log('session-export failed, error:', err);
    error = err;
  });

  fileExportManager.on('finished', (result: unknown) => {
    console.log('Exporting job finished', result);

    resultData = result;
  });

  const formattedSessions = formatExportableSessions(
    interviewsSessions,
    installedProtocols,
  );

  // The protocol object needs to be reformatted so that it is keyed by
  // the sha of protocol.name, since this is what network-exporters use.
  const reformatedProtocols = Object.values(installedProtocols).reduce(
    (acc, protocol) => ({
      ...acc,
      [getRemoteProtocolID(protocol.name)]: protocol,
    }),
    {},
  );

  const exportJob = fileExportManager.exportSessions(
    formattedSessions,
    reformatedProtocols,
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
  const { run, abort, setConsideringAbort } = await exportJob;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await run();

  return { data: resultData, error };
};
