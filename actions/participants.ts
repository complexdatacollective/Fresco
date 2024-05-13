'use server';

import { createId } from '@paralleldrive/cuid2';
import { revalidateTag } from 'next/cache';
import {
  participantListInputSchema,
  updateSchema,
} from '~/schemas/participant';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';
import { addEvent } from '~/actions/activityFeed';

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

  revalidateTag('getParticipants');
  revalidateTag('summaryStatistics');
}

export async function deleteAllParticipants() {
  await requireApiAuth();

  await prisma.participant.deleteMany();

  revalidateTag('getParticipants');
  revalidateTag('summaryStatistics');
}

export async function importParticipants(rawInput: unknown) {
  await requireApiAuth();

  const participantList = participantListInputSchema.parse(rawInput);

  // Ensure all participants have an identifier by generating one for any
  // that don't have one.
  const participantsWithIdentifiers = participantList.map((participant) => {
    return {
      identifier: participant.identifier ?? createId(),
      ...participant,
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

    revalidateTag('getParticipants');
    revalidateTag('summaryStatistics');

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

  const { identifier, data } = updateSchema.parse(rawInput);

  try {
    const updatedParticipant = await prisma.participant.update({
      where: { identifier },
      data,
    });

    revalidateTag('getParticipants');
    revalidateTag('summaryStatistics');

    return { error: null, participant: updatedParticipant };
  } catch (error) {
    return { error: 'Failed to update participant', participant: null };
  }
}

export async function createParticipant(rawInput: unknown) {
  await requireApiAuth();

  const participants = participantListInputSchema.parse(rawInput);

  const participantsWithIdentifiers = participants.map((participant) => {
    return {
      identifier: participant.identifier ?? createId(),
      ...participant,
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

    revalidateTag('getParticipants');
    revalidateTag('summaryStatistics');

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
