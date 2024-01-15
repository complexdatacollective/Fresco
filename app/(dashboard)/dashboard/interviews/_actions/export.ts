/* eslint-disable no-console */
'use server';

import FileExportManager from '~/lib/network-exporters/FileExportManager';
import { api } from '~/trpc/server';
import { formatExportableSessions, getRemoteProtocolID } from './utils';

export const exportSessions = async () => {
  const interviewsSessions = await api.interview.get.all.query();
  const installedProtocols = await api.protocol.get.all.query();

  const fileExportManager = new FileExportManager();

  fileExportManager.on('begin', () => {
    console.log({
      statusText: 'Starting export...',
      percentProgress: 0,
    });
  });

  fileExportManager.on('update', ({ statusText, progress }) => {
    console.log({
      statusText,
      percentProgress: progress,
    });
  });

  fileExportManager.on('cancelled', () => {
    console.log('showCancellationToast');
  });

  fileExportManager.on('session-exported', (sessionId) => {
    if (!sessionId || typeof sessionId !== 'string') {
      console.warn('session-exported event did not contain a sessionID');
      return;
    }
    console.log('session-exported success');
  });

  fileExportManager.on('error', (error) => {
    console.log('session-export failed, error:', error);
  });

  fileExportManager.on('finished', () => {
    console.log('Exporting job finished');
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

  const { run, abort, setConsideringAbort } = await exportJob;

  await run();
};
