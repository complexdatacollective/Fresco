'use server';

import { createId } from '@paralleldrive/cuid2';
import { after } from 'next/server';
import { requireApiAuth } from '~/lib/auth/guards';
import { safeRevalidateTag, safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { createInitialNetwork } from '@codaco/interview';
import { captureException, shutdownPostHog } from '~/lib/posthog-server';
import { getAppSetting } from '~/queries/appSettings';
import type { CreateInterview, DeleteInterviews } from '~/schemas/interviews';
import { ensureError } from '~/utils/ensureError';
import { addEvent } from './activityFeed';

export async function deleteInterviews(data: DeleteInterviews) {
  const session = await requireApiAuth();

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
      `User ${session.user.username} deleted ${deletedInterviews.count} interview(s)`,
    );

    safeUpdateTag('getInterviews');
    safeUpdateTag('summaryStatistics');
    safeUpdateTag('activityFeed');

    return { error: null, interview: deletedInterviews };
  } catch (error) {
    return { error: 'Failed to delete interviews', interview: null };
  }
}

/**
 * Read-your-own-writes refresh of the interviews list after an export.
 *
 * The export runs in a route handler, which can only `safeRevalidateTag`
 * (stale-while-revalidate) — so a client `router.refresh()` after the export
 * still renders the pre-export status. A server action can `safeUpdateTag`,
 * which expires the cache so the next read (the refresh) is fresh. The route
 * has already committed `exportTime` by the time the client calls this.
 */
export async function revalidateInterviewsAfterExport() {
  await requireApiAuth();
  safeUpdateTag('getInterviews');
  safeUpdateTag('activityFeed');
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
