'use server';

import { createId } from '@paralleldrive/cuid2';
import { unlink } from 'node:fs/promises';
import { after } from 'next/server';
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
} from '~/lib/network-exporters/utils/types';
import {
  captureEvent,
  captureException,
  shutdownPostHog,
} from '~/lib/posthog-server';
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

export const exportInterviews = async (
  interviewIds: Interview['id'][],
  exportOptions: ExportOptions,
): Promise<ExportReturn> => {
  await requireApiAuth();

  const tempFilePaths: string[] = [];
  let exportStage = 'fetching interviews from database';

  try {
    const interviewsSessions = await getInterviewsForExport(interviewIds);

    const protocolsMap = new Map<string, ExportedProtocol>();
    interviewsSessions.forEach((session) => {
      protocolsMap.set(session.protocol.hash, session.protocol);
    });

    const formattedProtocols: Record<string, ExportedProtocol> =
      Object.fromEntries(protocolsMap);
    const formattedSessions = formatExportableSessions(interviewsSessions);

    exportStage = 'generating export files';
    const sessionsWithEgo = insertEgoIntoSessionNetworks(formattedSessions);
    const groupedSessions = groupByProtocolProperty(sessionsWithEgo);
    const resequencedSessions = resequenceIds(groupedSessions);
    const exportResults = await generateOutputFiles(
      formattedProtocols,
      exportOptions,
    )(resequencedSessions);

    exportResults.forEach((result) => {
      if (result.success) {
        tempFilePaths.push(result.filePath);
      }
    });

    exportStage = 'creating zip archive';
    const archiveResult = await archive(exportResults);
    tempFilePaths.push(archiveResult.path);

    exportStage = 'uploading zip file';
    const result = await uploadZipToUploadThing(archiveResult);

    after(async () => {
      await captureEvent('DataExported', {
        status: result.status,
        sessions: interviewIds.length,
        exportOptions,
        result,
      });
      await shutdownPostHog();
    });

    safeUpdateTag('getInterviews');

    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    const e = ensureError(error);

    after(async () => {
      await captureException(e, {
        exportStage,
        interviewCount: interviewIds.length,
        exportOptions,
      });
      await shutdownPostHog();
    });

    const userMessage = getExportErrorMessage(e, exportStage);

    return {
      status: 'error',
      error: userMessage,
    };
  } finally {
    await cleanupTempFiles(tempFilePaths);
  }
};

function getExportErrorMessage(error: Error, stage: string): string {
  const message = error.message.toLowerCase();

  if (message.includes('heap') || message.includes('memory')) {
    return `Export ran out of memory while ${stage}. Try exporting fewer interviews at a time.`;
  }

  if (message.includes('enospc') || message.includes('no space')) {
    return `Export ran out of disk space while ${stage}. Please free up server storage and try again.`;
  }

  if (
    message.includes('timeout') ||
    message.includes('timedout') ||
    message.includes('timed out') ||
    message.includes('etimedout') ||
    message.includes('econnreset')
  ) {
    return `Export timed out while ${stage}. Try exporting fewer interviews at a time.`;
  }

  if (
    message.includes('econnrefused') ||
    message.includes('database') ||
    message.includes('prisma')
  ) {
    return `Database connection failed while ${stage}. Please try again later.`;
  }

  return `Export failed while ${stage}: ${error.message}`;
}

async function cleanupTempFiles(filePaths: string[]) {
  await Promise.allSettled(
    filePaths.map((filePath) =>
      unlink(filePath).catch(() => {
        // Ignore cleanup errors — files may already be deleted
      }),
    ),
  );
}

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

    const { label, identifier } = createdInterview.participant;
    const participantDisplay = label ? `${label} (${identifier})` : identifier;

    void addEvent(
      'Interview Started',
      `Participant "${participantDisplay}" started an interview`,
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

    after(async () => {
      await captureException(e);
      await shutdownPostHog();
    });

    return {
      errorType: e.message,
      error: 'Failed to create interview',
      createdInterviewId: null,
    };
  }
}
