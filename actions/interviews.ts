'use server';

import { type NcNetwork } from '@codaco/shared-consts';
import { createId } from '@paralleldrive/cuid2';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { after } from 'next/server';
import superjson from 'superjson';
import {
  captureEvent,
  captureException,
  shutdownPostHog,
} from '~/lib/posthog-server';
import { safeRevalidateTag, safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { type Interview } from '~/lib/db/generated/client';
import { createInitialNetwork } from '~/lib/interviewer/ducks/modules/session';
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
import {
  getInterviewsForExport,
  type GetInterviewsForExportQuery,
} from '~/queries/interviews';
import type { CreateInterview, DeleteInterviews } from '~/schemas/interviews';
import { requireApiAuth } from '~/utils/auth';
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

    safeUpdateTag('getInterviews');
    safeUpdateTag('summaryStatistics');
    safeUpdateTag('activityFeed');

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

    safeUpdateTag('getInterviews');
    safeUpdateTag('activityFeed');

    void addEvent(
      'Data Exported',
      `Exported data for ${updatedInterviews.count} interview(s)`,
    );

    return { error: null, interview: updatedInterviews };
  } catch (error) {
    return { error: 'Failed to update interviews', interview: null };
  }
};

export type ExportedProtocol =
  Awaited<GetInterviewsForExportQuery>[number]['protocol'];

export const prepareExportData = async (interviewIds: Interview['id'][]) => {
  await requireApiAuth();

  const interviewsSessionsRaw = await getInterviewsForExport(interviewIds);
  const interviewsSessions = superjson.parse<GetInterviewsForExportQuery>(
    interviewsSessionsRaw,
  );

  const protocolsMap = new Map<string, ExportedProtocol>();
  interviewsSessions.forEach((session) => {
    protocolsMap.set(session.protocol.hash, session.protocol);
  });

  const formattedProtocols = Object.fromEntries(protocolsMap);

  const formattedSessions = formatExportableSessions(interviewsSessions);

  return {
    formattedSessions: superjson.stringify(formattedSessions),
    formattedProtocols: superjson.stringify(formattedProtocols),
  };
};
export type FormattedProtocols = Record<string, ExportedProtocol>;

export const exportSessions = async (
  formattedSessions: FormattedSession[],
  formattedProtocols: FormattedProtocols,
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

    void captureEvent('DataExported', {
      status: result.status,
      sessions: interviewIds.length,
      exportOptions,
      result,
    });
    after(async () => {
      await shutdownPostHog();
    });

    safeUpdateTag('getInterviews');

    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    const e = ensureError(error);
    void captureException(e);
    after(async () => {
      await shutdownPostHog();
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
        network: createInitialNetwork(),
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

    /**
     * NOTE: this function is called from a route handler, so it has to use
     * revalidateTag rather than updateTag!
     */
    safeRevalidateTag('getInterviews');
    safeRevalidateTag('getParticipants');
    safeRevalidateTag('summaryStatistics');
    safeRevalidateTag('activityFeed');

    return {
      error: null,
      createdInterviewId: createdInterview.id,
      errorType: null,
    };
  } catch (error) {
    const e = ensureError(error);

    void captureException(e);
    after(async () => {
      await shutdownPostHog();
    });

    return {
      errorType: e.message,
      error: 'Failed to create interview',
      createdInterviewId: null,
    };
  }
}

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

    const network = JSON.parse(
      JSON.stringify(updatedInterview.network),
    ) as NcNetwork;

    void addEvent(
      'Interview Completed',
      `Interview with ID ${interviewId} has been completed`,
      {
        nodeCount: network?.nodes?.length ?? 0,
        edgeCount: network?.edges?.length ?? 0,
      },
    );

    (await cookies()).set(updatedInterview.protocolId, 'completed');

    safeUpdateTag('getInterviews');
    safeUpdateTag('summaryStatistics');
    safeUpdateTag('activityFeed');
    revalidatePath('/dashboard');

    return { error: null };
  } catch (error) {
    return { error: 'Failed to finish interview' };
  }
}
