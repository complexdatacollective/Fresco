'use server';

import { type Interview, type Protocol } from '@prisma/client';
import { trackEvent } from '~/analytics/utils';
import { type InstalledProtocols } from '~/lib/interviewer/store';
import FileExportManager from '~/lib/network-exporters/FileExportManager';
import {
  formatExportableSessions,
  type FormattedSessions,
} from '~/lib/network-exporters/formatters/session/formatExportableSessions';
import { type ExportOptions } from '~/lib/network-exporters/utils/exportOptionsSchema';
import { api } from '~/trpc/server';
import { getServerSession } from '~/utils/auth';
import { ensureError } from '~/utils/ensureError';

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
  formattedProtocols: InstalledProtocols,
  interviewIds: Interview['id'][],
  exportOptions: ExportOptions,
) => {
  try {
    const fileExportManager = new FileExportManager(exportOptions);

    const result = await fileExportManager.exportSessions(
      formattedSessions,
      formattedProtocols,
    );

    void trackEvent({
      type: 'DataExported',
      metadata: {
        status: result.status,
        sessions: interviewIds.length,
        exportOptions,
        resultError: result.error ?? null,
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
      error: e.message,
    };
  }
};
