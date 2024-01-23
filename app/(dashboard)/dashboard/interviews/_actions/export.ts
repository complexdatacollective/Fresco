'use server';

import FileExportManager from '~/lib/network-exporters/FileExportManager';
import { api } from '~/trpc/server';
import { getServerSession } from '~/utils/auth';
import { formatExportableSessions, getRemoteProtocolID } from './utils';
import { trackEvent } from '~/analytics/utils';
import { type ExportOptions } from '../_components/ExportInterviewsDialog';
import { type Interview } from '@prisma/client';

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
  interviewIds: Interview['id'][],
  exportOptions?: ExportOptions,
) => {
  try {
    const session = await getServerSession();

    if (!session) {
      throw new Error('You must be logged in to export interview sessions!.');
    }

    const installedProtocols = await api.protocol.get.all.query();
    const interviewsSessions =
      await api.interview.get.forExport.query(interviewIds);

    const fileExportManager = new FileExportManager(exportOptions);

    fileExportManager.on('begin', () => {
      // eslint-disable-next-line no-console
      console.log({
        statusText: 'Starting export...',
        percentProgress: 0,
      });
    });

    fileExportManager.on('update', ({ statusText, progress }: UpdateItems) => {
      // eslint-disable-next-line no-console
      console.log({
        statusText,
        percentProgress: progress,
      });
    });

    fileExportManager.on('session-exported', (sessionId: unknown) => {
      if (!sessionId || typeof sessionId !== 'string') {
        // eslint-disable-next-line no-console
        console.warn('session-exported event did not contain a sessionID');
        return;
      }
      // eslint-disable-next-line no-console
      console.log('session-exported success sessionId:', sessionId);
    });

    fileExportManager.on('error', (errResult: FailResult) => {
      // eslint-disable-next-line no-console
      console.log('Session export failed, Error:', errResult.message);
    });

    fileExportManager.on(
      'finished',
      ({ statusText, progress }: UpdateItems) => {
        // eslint-disable-next-line no-console
        console.log({
          statusText,
          percentProgress: progress,
        });
      },
    );

    // const formattedSessions = formatExportableSessions(interviewsSessions);

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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { run } = await exportJob;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const output: SuccessResult = await run(); // main export method

    // update export time of interviews
    const updatedInterviews =
      await api.interview.updateExportTime.mutate(interviewIds);

    if (updatedInterviews.error) throw new Error(updatedInterviews.error);

    await trackEvent({
      type: 'DataExported',
      metadata: {
        sessions: interviewIds.length,
      },
    });
    return { ...output };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await trackEvent({
      type: 'Error',
      error: {
        message: 'Failed to export interview sessions!',
        details: '',
        stacktrace: '',
        path: '/(dashboard)/dashboard/interviews/_actions/export.ts',
      },
    });

    return {
      data: null,
      message: 'Failed to export interview sessions!',
      error,
    };
  }
};
