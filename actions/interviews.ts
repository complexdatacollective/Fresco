'use server';

import { createId } from '@paralleldrive/cuid2';
import { Prisma, type Interview, type Protocol } from '@prisma/client';
import { revalidateTag } from 'next/cache';
import { trackEvent } from '~/lib/analytics';
import FileExportManager from '~/lib/network-exporters/FileExportManager';
import {
  type FormattedSessions,
  formatExportableSessions,
} from '~/lib/network-exporters/formatters/formatExportableSessions';
import type { ExportOptions } from '~/lib/network-exporters/utils/exportOptionsSchema';
import { getInterviewsForExport } from '~/queries/interviews';
import type {
  CreateInterview,
  DeleteInterviews,
  SyncInterview,
} from '~/schemas/interviews';
import type { FailResult, SuccessResult, UpdateItems } from '~/types/types';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';
import { ensureError } from '~/utils/ensureError';
import { addEvent } from './activityFeed';

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

    void addEvent(
      'Interview(s) Deleted',
      `Deleted ${deletedInterviews.count} interview(s)`,
    );

    revalidateTag('getInterviews');
    revalidateTag('summaryStatistics');

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

    revalidateTag('getInterviews');

    return { error: null, interview: updatedInterviews };
  } catch (error) {
    return { error: 'Failed to update interviews', interview: null };
  }
};

export const prepareExportData = async (interviewIds: Interview['id'][]) => {
  await requireApiAuth();

  const interviewsSessions = await getInterviewsForExport(interviewIds);

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
  await requireApiAuth();

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
      console.log('Session export failed, Error:', errResult.error);
      void trackEvent({
        type: 'Error',
        name: 'SessionExportFailed',
        message: errResult.error,
        metadata: {
          errResult,
          path: '~/actions/interviews.ts',
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
        result,
      },
    });

    revalidateTag('getInterviews');

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
        path: '~/actions/interviews.ts',
      },
    });

    return {
      data: null,
      error: `Error during data export: ${e.message}`,
    };
  }
};

export async function createInterview(data: CreateInterview) {
  const { participantIdentifier, protocolId } = data;

  /**
   * If no participant identifier is provided, we check if anonymous recruitment is enabled.
   * If it is, we create a new participant and use that identifier.
   */
  const participantStatement = participantIdentifier
    ? {
        connect: {
          identifier: participantIdentifier,
        },
      }
    : {
        create: {
          identifier: `p-${createId()}`,
          label: 'Anonymous Participant',
        },
      };

  try {
    if (!participantIdentifier) {
      const appSettings = await prisma.appSettings.findFirst();
      if (!appSettings || !appSettings.allowAnonymousRecruitment) {
        return {
          errorType: 'no-anonymous-recruitment',
          error: 'Anonymous recruitment is not enabled',
          createdInterviewId: null,
        };
      }
    }

    const createdInterview = await prisma.interview.create({
      select: {
        participant: true,
        id: true,
      },
      data: {
        network: Prisma.JsonNull,
        participant: participantStatement,
        protocol: {
          connect: {
            id: protocolId,
          },
        },
      },
    });

    void addEvent(
      'Interview Started',
      `Participant "${
        createdInterview.participant.label ??
        createdInterview.participant.identifier
      }" started an interview`,
    );

    revalidateTag('getInterviews');
    revalidateTag('getParticipants');
    revalidateTag('summaryStatistics');

    return {
      error: null,
      createdInterviewId: createdInterview.id,
      errorType: null,
    };
  } catch (error) {
    const e = ensureError(error);

    void trackEvent({
      type: 'Error',
      name: e.name,
      message: e.message,
      stack: e.stack,
      metadata: {
        path: '/routers/interview.ts',
      },
    });

    return {
      errorType: e.message,
      error: 'Failed to create interview',
      createdInterviewId: null,
    };
  }
}

export async function syncInterview(data: SyncInterview) {
  const { id, network, currentStep, stageMetadata } = data;

  try {
    await prisma.interview.update({
      where: {
        id,
      },
      data: {
        network,
        currentStep,
        stageMetadata,
        lastUpdated: new Date(),
      },
    });

    revalidateTag(`getInterviewById-${id}`);

    console.log(`🚀 Interview synced with server! (${id})`);
    return { success: true };
  } catch (error) {
    const message = ensureError(error).message;
    return { success: false, error: message };
  }
}

export type SyncInterviewType = typeof syncInterview;

export async function finishInterview(interviewId: Interview['id']) {
  try {
    await prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
        finishTime: new Date(),
      },
    });

    void addEvent(
      'Interview Completed',
      `Interview with ID ${interviewId} has been completed`,
    );

    revalidateTag('getInterviews');
    revalidateTag('summaryStatistics');

    return { error: null };
  } catch (error) {
    return { error: 'Failed to finish interview' };
  }
}
