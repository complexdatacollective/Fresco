'use server';

import { type Interview, type Protocol } from '@prisma/client';
import { trackEvent } from '~/analytics/utils';
import { type InstalledProtocols } from '~/lib/interviewer/store';
import archive from '~/lib/network-exporters/formatters/session/archive';
import { formatExportableSessions } from '~/lib/network-exporters/formatters/session/formatExportableSessions';
import { generateOutputFiles } from '~/lib/network-exporters/formatters/session/generateOutputFiles';
import groupByProtocolProperty from '~/lib/network-exporters/formatters/session/groupByProtocolProperty';
import { insertEgoIntoSessionNetworks } from '~/lib/network-exporters/formatters/session/insertEgoIntoSessionnetworks';
import { resequenceIds } from '~/lib/network-exporters/formatters/session/resequenceIds';
import { uploadZipToUploadThing } from '~/lib/network-exporters/formatters/session/uploadZipToUploadThing';
import type {
  ExportOptions,
  FormattedSession,
} from '~/lib/network-exporters/utils/types';
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
  formattedSessions: FormattedSession[],
  formattedProtocols: InstalledProtocols,
  interviewIds: Interview['id'][],
  exportOptions: ExportOptions,
) => {
  try {
    const result = await Promise.resolve(formattedSessions)
      .then(insertEgoIntoSessionNetworks)
      .then(groupByProtocolProperty)
      .then(resequenceIds)
      .then(generateOutputFiles(formattedProtocols, exportOptions))
      .then(archive)
      .then(uploadZipToUploadThing);

    console.log(result);

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
