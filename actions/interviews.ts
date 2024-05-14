'use server';

import { createId } from '@paralleldrive/cuid2';
import { Prisma, type Interview, type Protocol } from '@prisma/client';
import { revalidateTag } from 'next/cache';
import { trackEvent } from '~/lib/analytics';
import type { InstalledProtocols } from '~/lib/interviewer/store';
import { formatExportableSessions } from '~/lib/network-exporters/formatters/formatExportableSessions';
import archive from '~/lib/network-exporters/formatters/session/archive';
import { generateOutputFiles } from '~/lib/network-exporters/formatters/session/generateOutputFiles';
import groupByProtocolProperty from '~/lib/network-exporters/formatters/session/groupByProtocolProperty';
import { insertEgoIntoSessionNetworks } from '~/lib/network-exporters/formatters/session/insertEgoIntoSessionNetworks';
import { resequenceIds } from '~/lib/network-exporters/formatters/session/resequenceIds';
import type {
  ExportOptions,
  ExportReturn,
  FormattedSession,
} from '~/lib/network-exporters/utils/types';
import { getInterviewsForExport } from '~/queries/interviews';
import type {
  CreateInterview,
  DeleteInterviews,
  SyncInterview,
} from '~/schemas/interviews';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';
import { ensureError } from '~/utils/ensureError';
import { addEvent } from './activityFeed';
import { uploadZipToUploadThing } from './uploadThing';

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

  const formattedProtocols: InstalledProtocols =
    Object.fromEntries(protocolsMap);
  const formattedSessions = formatExportableSessions(interviewsSessions);

  return { formattedSessions, formattedProtocols };
};

export const exportSessions = async (
  formattedSessions: FormattedSession[],
  formattedProtocols: InstalledProtocols,
  interviewIds: Interview['id'][],
  exportOptions: ExportOptions,
): Promise<ExportReturn> => {
  await requireApiAuth();

  try {
    const result = await Promise.resolve(formattedSessions)
      .then(insertEgoIntoSessionNetworks)
      .then(groupByProtocolProperty)
      .then(resequenceIds)
      .then(generateOutputFiles(formattedProtocols, exportOptions))
      .then(archive)
      .then(uploadZipToUploadThing);

    void trackEvent({
      type: 'DataExported',
      metadata: {
        status: result.status,
        sessions: interviewIds.length,
        exportOptions,
        result: result,
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
      status: 'error',
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

    // eslint-disable-next-line no-console
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
