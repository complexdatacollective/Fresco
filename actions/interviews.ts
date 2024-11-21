'use server';

import { createId } from '@paralleldrive/cuid2';
import { Prisma, type Interview, type Protocol } from '@prisma/client';
import { cookies } from 'next/headers';
import trackEvent from '~/lib/analytics';
import { safeRevalidateTag } from '~/lib/cache';
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
import { getAppSetting } from '~/queries/appSettings';
import { getInterviewsForExport } from '~/queries/interviews';
import type {
  CreateInterview,
  DeleteInterviews,
  SyncInterview,
} from '~/schemas/interviews';
import { type NcNetwork } from '~/schemas/network-canvas';
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

    safeRevalidateTag('getInterviews');
    safeRevalidateTag('summaryStatistics');

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

    safeRevalidateTag('getInterviews');

    void addEvent(
      'Data Exported',
      `Exported data for ${updatedInterviews.count} interview(s)`,
    );

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

    safeRevalidateTag('getInterviews');

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

  try {
    if (!participantIdentifier) {
      const allowAnonymousRecruitment = await getAppSetting(
        'allowAnonymousRecruitment',
      );
      if (!allowAnonymousRecruitment) {
        return {
          errorType: 'no-anonymous-recruitment',
          error: 'Anonymous recruitment is not enabled',
          createdInterviewId: null,
        };
      }
    }

    /**
     * If a participant identifier is provided, we attempt to connect to an existing participant
     * or create a new one with that identifier. If no participant identifier is provided,
     * we create a new anonymous participant with a generated identifier.
     */
    const participantStatement = participantIdentifier
      ? {
          connectOrCreate: {
            create: {
              identifier: participantIdentifier,
            },
            where: {
              identifier: participantIdentifier,
            },
          },
        }
      : {
          create: {
            identifier: `p-${createId()}`,
            label: 'Anonymous Participant',
          },
        };

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

    safeRevalidateTag('getInterviews');
    safeRevalidateTag('getParticipants');
    safeRevalidateTag('summaryStatistics');

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

    safeRevalidateTag(`getInterviewById-${id}`);

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
    const updatedInterview = await prisma.interview.update({
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

    const network = JSON.parse(
      JSON.stringify(updatedInterview.network),
    ) as NcNetwork;

    void trackEvent({
      type: 'InterviewCompleted',
      metadata: {
        nodeCount: network?.nodes?.length ?? 0,
        edgeCount: network?.edges?.length ?? 0,
      },
    });

    (await cookies()).set(updatedInterview.protocolId, 'completed');

    safeRevalidateTag('getInterviews');
    safeRevalidateTag('summaryStatistics');

    return { error: null };
  } catch (error) {
    return { error: 'Failed to finish interview' };
  }
}
