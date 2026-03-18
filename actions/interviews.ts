'use server';

import { createId } from '@paralleldrive/cuid2';
import { Effect } from 'effect';
import { after } from 'next/server';
import { safeRevalidateTag, safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { type Interview } from '~/lib/db/generated/client';
import { ExportLayer } from '~/lib/export/layers/ExportLayer';
import { exportPipeline } from '~/lib/export/pipeline';
import { createInitialNetwork } from '~/lib/interviewer/ducks/modules/session';
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
import type { CreateInterview, DeleteInterviews } from '~/schemas/interviews';
import { requireApiAuth } from '~/utils/auth';
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

export const exportInterviews = async (
  interviewIds: Interview['id'][],
  exportOptions: ExportOptions,
): Promise<ExportReturn> => {
  await requireApiAuth();

  const result = await exportPipeline(interviewIds, exportOptions).pipe(
    Effect.catchAll((error) =>
      Effect.succeed({
        status: 'error' as const,
        error: error.userMessage,
      } satisfies ExportReturn),
    ),
    Effect.provide(ExportLayer),
    Effect.runPromise,
  );

  after(async () => {
    if (result.status === 'error') {
      await captureException(new Error(result.error ?? 'Unknown error'), {
        interviewCount: interviewIds.length,
        exportOptions,
      });
    } else {
      await captureEvent('DataExported', {
        status: result.status,
        sessions: interviewIds.length,
        exportOptions,
        result,
      });
    }
    await shutdownPostHog();
  });

  safeUpdateTag('getInterviews');
  return result;
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
