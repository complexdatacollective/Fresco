'use server';

import { type Interview, type Protocol } from '@prisma/client';
import { trackEvent } from '~/analytics/utils';
import FileExportManager from '~/lib/network-exporters/FileExportManager';
import {
  formatExportableSessions,
  type FormattedSessions,
} from '~/lib/network-exporters/formatters/formatExportableSessions';
import { type ExportOptions } from '~/lib/network-exporters/utils/exportOptionsSchema';
import { api } from '~/trpc/server';
import { getServerSession } from '~/utils/auth';
import { ensureError } from '~/utils/ensureError';

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

export const prepareExportData = async (interviewIds: Interview['id'][]) => {
  const session = await getServerSession();

  if (!session) {
    throw new Error('You must be logged in to export interview sessions!.');
  }

  const interviewsSessions =
    await api.interview.get.forExport.query(interviewIds);

  const protocolsMap = new Map<string, Protocol>();
  interviewsSessions.forEach((session) => {
    protocolsMap.set(session.protocol.hash, session.protocol);
  });

  const formattedProtocols = Object.fromEntries(protocolsMap);
  const formattedSessions = formatExportableSessions(interviewsSessions);

  return { formattedSessions, formattedProtocols };
};

export const exportSessions = async (
  formattedSessions: FormattedSessions,
  formattedProtocols: Record<string, Protocol>,
  interviewIds: Interview['id'][],
  exportOptions: ExportOptions,
) => {
  try {
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
      void trackEvent({
        type: 'Error',
        name: 'SessionExportFailed',
        message: errResult.message,
        metadata: {
          errResult,
          path: '/(dashboard)/dashboard/interviews/_actions/export.ts',
        },
      });
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
    const result: SuccessResult | FailResult = await run(); // main export method

    void trackEvent({
      type: 'DataExported',
      metadata: {
        sessions: interviewIds.length,
        exportOptions,
        resultError: result.error,
        resultMessage: result.message,
      },
    });

    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    const e = ensureError(error);
    void trackEvent({
      type: 'Error',
      name: e.name,
      message: e.message,
      stack: e.stack,
      metadata: {
        path: '/(dashboard)/dashboard/interviews/_actions/export.ts',
      },
    });

    return {
      data: null,
      message: 'Error during data export!',
      error,
    };
  }
};
