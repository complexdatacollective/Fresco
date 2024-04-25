'use server';

import type { Interview, Protocol } from '@prisma/client';
import { revalidateTag } from 'next/cache';
import { trackEvent } from '~/analytics/utils';
import FileExportManager from '~/lib/network-exporters/FileExportManager';
import { formatExportableSessions } from '~/lib/network-exporters/formatters/formatExportableSessions';
import type { ExportOptions } from '~/lib/network-exporters/utils/exportOptionsSchema';
import { getInterviewsForExport } from '~/queries/interviews';
import { type DeleteInterviews } from '~/schemas/interviews';
import type { FailResult, SuccessResult, UpdateItems } from '~/types/types';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';
import { ensureError } from '~/utils/ensureError';

export async function deleteInterviews(data: DeleteInterviews) {
  await requireApiAuth();

  const idsToDelete = data.map((p) => p.id);

  try {
    const deletedInterviews = await prisma.interview.deleteMany({
      where: {
        id: {
          in: idsToDelete,
        },
      },
    });

    await prisma.events.create({
      data: {
        type: 'Interview Deleted',
        message: `Deleted ${deletedInterviews.count} interview(s)`,
      },
    });

    revalidateTag('activitesTable');
    revalidateTag('getInterviews');

    return { error: null, interview: deletedInterviews };
  } catch (error) {
    return { error: 'Failed to delete interviews', interview: null };
  }
}

export const updateExportTime = async (interviewIds: Interview['id'][]) => {
  await requireApiAuth();
  try {
    const updatedInterviews = await prisma.interview.updateMany({
      where: {
        id: {
          in: interviewIds,
        },
      },
      data: {
        exportTime: new Date(),
      },
    });

    return { error: null, interview: updatedInterviews };
  } catch (error) {
    return { error: 'Failed to update interviews', interview: null };
  }
};

export const exportInterviews = async (
  interviewIds: Interview['id'][],
  exportOptions: ExportOptions,
) => {
  await requireApiAuth();
  try {
    // Get interviews From DB, by ids
    const interviewsSessions = await getInterviewsForExport(interviewIds);

    // store unique protocols in a Map, keyed by protocol hash
    const protocolsMap = new Map<string, Protocol>();
    interviewsSessions.forEach((session) => {
      protocolsMap.set(session.protocol.hash, session.protocol);
    });

    const formattedProtocols = Object.fromEntries(protocolsMap);
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
    const updatedInterviews = await updateExportTime(interviewIds);

    if (updatedInterviews.error) throw new Error(updatedInterviews.error);

    void (await trackEvent({
      type: 'DataExported',
      metadata: {
        sessions: interviewIds.length,
      },
    }));
    return { ...output };
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
        path: 'interview export action',
      },
    });

    return {
      data: null,
      message: 'Error during data export!',
      error,
    };
  }
};
