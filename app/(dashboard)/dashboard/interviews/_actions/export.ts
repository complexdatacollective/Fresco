'use server';

import { type Interview, type Protocol } from '@prisma/client';
import { trackEvent } from '~/analytics/utils';
import FileExportManager from '~/lib/network-exporters/FileExportManager';
import { formatExportableSessions } from '~/lib/network-exporters/formatters/formatExportableSessions';
import { api } from '~/trpc/server';
import { getServerSession } from '~/utils/auth';
import { ensureError } from '~/utils/ensureError';
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
  interviewIds: Interview['id'][],
  exportOptions?: ExportOptions,
) => {
  try {
    const session = await getServerSession();

    if (!session) {
      throw new Error('You must be logged in to export interview sessions!.');
    }

    // Get interviews From DB, by ids
    const interviewsSessions =
      await api.interview.get.forExport.query(interviewIds);

    // Store unique protocol ids in a Set
    const installedProtocolIds = new Set<Protocol['id']>();
    interviewsSessions.forEach((session) => {
      installedProtocolIds.add(session.protocol.id);
    });

    const installedProtocols: Protocol[] = [];

    // find installed protocols based on the stored unique set of protocol ids
    installedProtocolIds.forEach((id) => {
      const foundSession = interviewsSessions.find(
        (session) => session.protocol.id === id,
      );
      if (!foundSession) return;
      installedProtocols.push(foundSession.protocol);
    });

    // The protocol object needs to be reformatted so that it is keyed by
    // protocol.hash, since this is what network-exporters use.
    const formattedProtocols = Object.values(installedProtocols).reduce(
      (acc, protocol) => ({
        ...acc,
        [protocol.hash]: protocol,
      }),
      {},
    );

    const formattedSessions = formatExportableSessions(interviewsSessions);

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

    const exportJob = fileExportManager.exportSessions(
      formattedSessions,
      formattedProtocols,
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
    const e = ensureError(error);
    await trackEvent({
      type: 'Error',
      error: {
        message: e.name,
        details: e.message,
        path: '/(dashboard)/dashboard/interviews/_actions/export.ts',
        stacktrace: e.stack ?? '',
      },
    });

    return {
      data: null,
      message: 'Error during data export!',
      error,
    };
  }
};
