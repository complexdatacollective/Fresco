'use server';

import { createId } from '@paralleldrive/cuid2';
import { after } from 'next/server';

import { createInitialNetwork } from '@codaco/interview/contract';
import { COMPATIBLE_PROTOCOL_SCHEMA_VERSION } from '@codaco/interview/protocol-schema-version';
import { ensureError } from '@codaco/shared-consts';
import type { InterviewsSearchParams } from '~/app/dashboard/_components/InterviewsTable/searchParams';
import { addEvent } from '~/lib/activityFeed';
import { requireApiAuth } from '~/lib/auth/guards';
import { safeRevalidateTag, safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { Prisma } from '~/lib/db/generated/client';
import { captureException, flushPostHog } from '~/lib/posthog-server';
import { getAppSetting } from '~/queries/appSettings';
import { getInterviewIdsMatching } from '~/queries/interviews';
import type {
  CreateInterview,
  CreateInterviewResult,
  DeleteInterviews,
} from '~/schemas/interviews';
import { participantIdentifierSchema } from '~/schemas/participant';

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
 * Marks interviews exported after the browser has assembled and downloaded the
 * complete zip. This is the single commit point for a (possibly batched)
 * export: it sets exportTime, logs one activity event, and — because it is a
 * server action — triggers Next's route refresh via safeUpdateTag
 * (read-your-own-writes), so the interviews table shows the new status.
 */
export async function commitInterviewExport(interviewIds: string[]) {
  const session = await requireApiAuth();
  const ids = [...new Set(interviewIds)];
  if (ids.length === 0) {
    return { error: null, data: { count: 0 } };
  }

  try {
    const result = await prisma.interview.updateMany({
      where: { id: { in: ids } },
      data: { exportTime: new Date() },
    });
    await addEvent(
      'Data Exported',
      `User ${session.user.username} exported data for ${String(result.count)} interview(s)`,
      { interviewCount: result.count },
    );
    safeUpdateTag('getInterviews');
    safeUpdateTag('activityFeed');
    return { error: null, data: { count: result.count } };
  } catch {
    return { error: 'Failed to commit export', data: null };
  }
}

export async function resolveInterviewIds(
  searchParams: InterviewsSearchParams,
  extra?: { onlyUnexported?: boolean; onlyCompleted?: boolean },
): Promise<{ error: string | null; ids: string[] }> {
  await requireApiAuth();
  try {
    const ids = await getInterviewIdsMatching(searchParams, extra);
    return { error: null, ids };
  } catch {
    return { error: 'Failed to resolve interviews', ids: [] };
  }
}

export async function getInterviewDeletionInfo(ids: string[]): Promise<{
  error: string | null;
  data: { id: string; exportTime: Date | null }[];
}> {
  await requireApiAuth();
  try {
    const uniqueIds = [...new Set(ids)];
    const interviews = await prisma.interview.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, exportTime: true },
    });
    return { error: null, data: interviews };
  } catch {
    return { error: 'Failed to resolve interviews', data: [] };
  }
}

export type IncompleteInterviewUrlData = {
  id: string;
  identifier: string;
};

/**
 * Returns the minimal data needed to build incomplete-interview URL CSVs for a
 * single protocol: the interview id (for the URL) and participant identifier.
 * Scoped to incomplete interviews (no finishTime) so the client no longer needs
 * the full interview list to generate these URLs.
 */
export async function getIncompleteInterviewUrlData(
  protocolId: string,
): Promise<{ error: string | null; data: IncompleteInterviewUrlData[] }> {
  await requireApiAuth();
  try {
    const interviews = await prisma.interview.findMany({
      where: { protocolId, finishTime: null },
      select: { id: true, participant: { select: { identifier: true } } },
    });
    return {
      error: null,
      data: interviews.map((interview) => ({
        id: interview.id,
        identifier: interview.participant.identifier,
      })),
    };
  } catch {
    return { error: 'Failed to load incomplete interviews', data: [] };
  }
}

/**
 * Prisma raises P2025 when a nested `connect` cannot resolve the record it
 * points at. For `createInterview` that can only be the protocol connect, so
 * it means the protocol was deleted between the existence check below and the
 * write — the one gap that check cannot close on its own.
 */
function isMissingProtocol(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

export async function createInterview(
  data: CreateInterview,
): Promise<CreateInterviewResult> {
  const { participantIdentifier, protocolId } = data;

  try {
    // A protocol that no longer exists is the whole answer: nothing else about
    // the request can be acted on, and reporting any other reason sends the
    // researcher after a fix that cannot help — enabling anonymous
    // recruitment, or correcting an identifier on a link that is dead either
    // way. So this precedes every other return, rather than being reached only
    // when nothing else fails first.
    const protocol = await prisma.protocol.findUnique({
      where: { id: protocolId },
      select: { id: true, schemaVersion: true },
    });

    if (!protocol) {
      return {
        errorType: 'no-protocol',
        error: 'Protocol not found',
        createdInterviewId: null,
      };
    }

    // A protocol the deploy-time migration left below the runtime's schema
    // version cannot run an interview — the payload builder refuses it. Refuse
    // here, before anything is persisted, so a recruitment link to such a
    // protocol does not record a started-but-unusable interview per attempt.
    if (protocol.schemaVersion !== COMPATIBLE_PROTOCOL_SCHEMA_VERSION) {
      return {
        errorType: 'incompatible-protocol',
        error:
          'Protocol is stored under a schema version this deployment cannot run. Repair it in Architect and upload it again.',
        createdInterviewId: null,
      };
    }

    // The participant identifier may arrive unauthenticated via /onboard, so
    // validate it (length, trim, non-whitespace) before it is persisted and
    // later embedded in activity-feed messages and CSV exports.
    let validatedIdentifier: string | undefined;
    if (participantIdentifier !== undefined && participantIdentifier !== '') {
      const parsed = participantIdentifierSchema.safeParse(
        participantIdentifier,
      );
      if (!parsed.success) {
        return {
          errorType: 'invalid-identifier',
          error: 'Invalid participant identifier',
          createdInterviewId: null,
        };
      }
      validatedIdentifier = parsed.data;
    }

    if (!validatedIdentifier) {
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
    const participantStatement = validatedIdentifier
      ? {
          connectOrCreate: {
            create: {
              identifier: validatedIdentifier,
            },
            where: {
              identifier: validatedIdentifier,
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
    // A participant following a link to a protocol that no longer exists is an
    // expected outcome of an unauthenticated, user-supplied id — report it to
    // the caller so it can be explained, but never as an application exception.
    if (isMissingProtocol(error)) {
      return {
        errorType: 'no-protocol',
        error: 'Protocol not found',
        createdInterviewId: null,
      };
    }

    const e = ensureError(error);

    after(async () => {
      await captureException(e);
      await flushPostHog();
    });

    return {
      errorType: 'unknown',
      error: 'Failed to create interview',
      createdInterviewId: null,
    };
  }
}
