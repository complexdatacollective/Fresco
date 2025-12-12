'use server';

import { createId } from '@paralleldrive/cuid2';
import { addEvent } from '~/actions/activityFeed';
import { safeRevalidateTag } from '~/lib/cache';
import {
  participantListInputSchema,
  updateSchema,
} from '~/schemas/participant';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/lib/db/client';

export async function deleteParticipants(participantIds: string[]) {
  await requireApiAuth();

  const result = await prisma.participant.deleteMany({
    where: {
      id: { in: participantIds },
    },
  });

  void addEvent(
    'Participant(s) Removed',
    `Deleted ${result.count} participant(s)`,
  );

  safeRevalidateTag('getParticipants');
  safeRevalidateTag('getInterviews');
  safeRevalidateTag('summaryStatistics');
}

export async function deleteAllParticipants() {
  await requireApiAuth();

  const result = await prisma.participant.deleteMany();

  void addEvent(
    'Participant(s) Removed',
    `Deleted ${result.count} participant(s)`,
  );

  safeRevalidateTag('getParticipants');
  safeRevalidateTag('getInterviews');
  safeRevalidateTag('summaryStatistics');
}

export async function importParticipants(rawInput: unknown) {
  await requireApiAuth();

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
      `Added ${createdParticipants.count} participant(s)`,
    );

    safeRevalidateTag('getParticipants');
    safeRevalidateTag('summaryStatistics');

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

    safeRevalidateTag('getParticipants');
    safeRevalidateTag('summaryStatistics');

    return { error: null, participant: updatedParticipant };
  } catch (error) {
    return { error: 'Failed to update participant', participant: null };
  }
}

export async function createParticipant(rawInput: unknown) {
  await requireApiAuth();

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
      `Added ${createdParticipants.count} participant(s)`,
    );

    safeRevalidateTag('getParticipants');
    safeRevalidateTag('summaryStatistics');

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
