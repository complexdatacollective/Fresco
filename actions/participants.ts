'use server';

import { createId } from '@paralleldrive/cuid2';
import { addEvent } from '~/actions/activityFeed';
import { requireApiAuth } from '~/lib/auth/guards';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { getParticipantIdsMatching } from '~/queries/participants';
import {
  participantListInputSchema,
  updateSchema,
} from '~/schemas/participant';
import type { ParticipantsSearchParams } from '~/app/dashboard/_components/ParticipantsTable/searchParams';

export async function deleteParticipants(participantIds: string[]) {
  const session = await requireApiAuth();

  const result = await prisma.participant.deleteMany({
    where: {
      id: { in: participantIds },
    },
  });

  void addEvent(
    'Participant(s) Removed',
    `User ${session.user.username} removed ${result.count} participant(s)`,
  );

  safeUpdateTag('getParticipants');
  safeUpdateTag('getInterviews');
  safeUpdateTag('summaryStatistics');
  safeUpdateTag('activityFeed');
}

export async function resolveParticipantIds(
  searchParams: ParticipantsSearchParams,
): Promise<{ error: string | null; ids: string[] }> {
  await requireApiAuth();
  try {
    const ids = await getParticipantIdsMatching(searchParams);
    return { error: null, ids };
  } catch {
    return { error: 'Failed to resolve participants', ids: [] };
  }
}

export type ParticipantExportRow = {
  id: string;
  identifier: string;
  label: string | null;
};

export async function getParticipantsForExport(ids: string[]): Promise<{
  error: string | null;
  data: ParticipantExportRow[];
}> {
  await requireApiAuth();
  try {
    const uniqueIds = [...new Set(ids)];
    const participants = await prisma.participant.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, identifier: true, label: true },
    });
    return { error: null, data: participants };
  } catch {
    return { error: 'Failed to resolve participants', data: [] };
  }
}

export type ParticipantDeletionInfo = {
  id: string;
  hasInterviews: boolean;
  hasUnexportedInterviews: boolean;
};

export async function getParticipantDeletionInfo(ids: string[]): Promise<{
  error: string | null;
  data: ParticipantDeletionInfo[];
}> {
  await requireApiAuth();
  try {
    const uniqueIds = [...new Set(ids)];
    const participants = await prisma.participant.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        _count: { select: { interviews: true } },
        interviews: { select: { exportTime: true } },
      },
    });
    return {
      error: null,
      data: participants.map((participant) => ({
        id: participant.id,
        hasInterviews: participant._count.interviews > 0,
        hasUnexportedInterviews: participant.interviews.some(
          (interview) => !interview.exportTime,
        ),
      })),
    };
  } catch {
    return { error: 'Failed to resolve participants', data: [] };
  }
}

export async function importParticipants(rawInput: unknown) {
  const session = await requireApiAuth();

  const participantList = participantListInputSchema.parse(rawInput);

  /*
  Format participantList:
  - Ensure all participants have an identifier by generating one for any that don't have one.
  - If participant label is empty string, set it to undefined
  */
  const participantsWithIdentifiers = participantList.map((participant) => {
    return {
      // Cannot use nullish coalescing here because of https://github.com/complexdatacollective/Fresco/pull/140/commits/06260b815558030b0605e14e5baf5a6ce238b1ab
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      identifier: !participant.identifier ? createId() : participant.identifier,
      label: participant.label === '' ? undefined : participant.label,
    };
  });

  try {
    const [existingParticipants, createdParticipants] =
      await prisma.$transaction([
        prisma.participant.findMany({
          where: {
            identifier: {
              in: participantsWithIdentifiers.map((p) => p.identifier),
            },
          },
        }),
        prisma.participant.createMany({
          data: participantsWithIdentifiers,
          skipDuplicates: true,
        }),
      ]);

    void addEvent(
      'Participant(s) Added',
      `User ${session.user.username} added ${createdParticipants.count} participant(s)`,
    );

    safeUpdateTag('getParticipants');
    safeUpdateTag('summaryStatistics');
    safeUpdateTag('activityFeed');

    return {
      error: null,
      createdParticipants: createdParticipants.count,
      existingParticipants: existingParticipants,
    };
  } catch (error) {
    return {
      error: 'Failed to create participant',
      createdParticipants: null,
      existingParticipants: null,
    };
  }
}

export async function updateParticipant(rawInput: unknown) {
  await requireApiAuth();

  const { existingIdentifier, formData } = updateSchema.parse(rawInput);

  try {
    const updatedParticipant = await prisma.participant.update({
      where: { identifier: existingIdentifier },
      data: formData,
    });

    safeUpdateTag('getParticipants');
    safeUpdateTag('summaryStatistics');

    return { error: null, participant: updatedParticipant };
  } catch (error) {
    return { error: 'Failed to update participant', participant: null };
  }
}

export async function createParticipant(rawInput: unknown) {
  const session = await requireApiAuth();

  const participants = participantListInputSchema.parse(rawInput);

  const participantsWithIdentifiers = participants.map((participant) => {
    const { identifier, ...rest } = participant;

    return {
      identifier: identifier ?? createId(),
      ...rest,
    };
  });

  try {
    const [existingParticipants, createdParticipants] =
      await prisma.$transaction([
        prisma.participant.findMany({
          where: {
            identifier: {
              in: participantsWithIdentifiers.map((p) => p.identifier),
            },
          },
        }),
        prisma.participant.createMany({
          data: participantsWithIdentifiers,
          skipDuplicates: true,
        }),
      ]);

    void addEvent(
      'Participant(s) Added',
      `User ${session.user.username} added ${createdParticipants.count} participant(s)`,
    );

    safeUpdateTag('getParticipants');
    safeUpdateTag('summaryStatistics');
    safeUpdateTag('activityFeed');

    return {
      error: null,
      createdParticipants: createdParticipants.count,
      existingParticipants: existingParticipants,
    };
  } catch (error) {
    return {
      error: 'Failed to create participant',
      createdParticipants: null,
      existingParticipants: null,
    };
  }
}
