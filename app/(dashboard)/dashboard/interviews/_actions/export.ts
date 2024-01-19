/* eslint-disable no-console */
'use server';

import FileExportManager from '~/lib/network-exporters/FileExportManager';
import { api } from '~/trpc/server';
import { getServerSession } from '~/utils/auth';
import { formatExportableSessions, getRemoteProtocolID } from './utils';
// import { trackEvent } from '~/analytics/utils';
import { type ExportOptions } from '../_components/ExportInterviewsDialog';

type UploadData = {
  key: string;
  url: string;
  name: string;
  size: number;
};

type UpdateItems = {
  statusText: string;
  progress: number;
};

type FailResult = {
  data: null;
  error: unknown;
  message: string;
};

type SuccessResult = {
  data: UploadData;
  error: null;
  message: string;
};

export const exportSessions = async (
  interviewIds: { id: string }[],
  exportOptions: ExportOptions,
) => {
  const session = await getServerSession();

  if (!session) {
    throw new Error('You must be logged in to export interview sessions!.');
  }

  const installedProtocols = await api.protocol.get.all.query();
  const interviewsSessions =
    await api.interview.get.manyByIds.query(interviewIds);

  const fileExportManager = new FileExportManager(exportOptions);

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

  fileExportManager.on('session-exported', (sessionId: unknown) => {
    if (!sessionId || typeof sessionId !== 'string') {
      console.warn('session-exported event did not contain a sessionID');
      return;
    }
    console.log('session-exported success sessionId:', sessionId);
  });

  fileExportManager.on('error', (errResult: FailResult) => {
    console.log('Session export failed, Error:', errResult.message);
  });

  fileExportManager.on('finished', ({ statusText, progress }: UpdateItems) => {
    console.log({
      statusText,
      percentProgress: progress,
    });
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

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { run } = await exportJob;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const output: SuccessResult = await run();

    // await trackEvent({
    //   type: 'InterviewCompleted',
    //   metadata: {
    //     success: true,
    //   },
    // });

    return { ...output };
  } catch (error) {
    console.error(error);

    // await trackEvent({
    //   type: 'Error',
    //   error: {
    //     message: 'Failed to export interview sessions!',
    //     details: 'Error details should go here!',
    //     stacktrace: '',
    //     path: '/dashboard/interviews',
    //   },
    // });

    return {
      data: null,
      message: 'Failed to export interview sessions!',
      error,
    };
  }
};
