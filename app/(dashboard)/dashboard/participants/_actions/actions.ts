'use server';

import { type Participant } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '~/utils/db';
import { safeLoader } from '~/utils/safeLoader';

// Create Participant
export const createParticipant = async (identifier: string) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  if (!identifier || typeof identifier !== 'string') {
    return { error: 'No identifier provided' };
  }

  const result = await safeLoader({
    outputValidation: z.object({
      id: z.string(),
      identifier: z.string(),
    }),
    loader: () =>
      prisma.participant.create({
        data: {
          identifier,
        },
      }),
  });

  if (!result) {
    return { error: 'Failed to create participant' };
  }

  revalidatePath('/dashboard/participants');

  return {
    message: 'Participant created',
    participant: result,
  };
};

// Delete Participant
export const deleteParticipant = async (id: string) => {
  const result = await safeLoader({
    outputValidation: z.object({
      id: z.string(),
      identifier: z.string(),
    }),
    loader: () =>
      prisma.participant.delete({
        where: { id },
      }),
  });

  if (!result) {
    return { error: 'Failed to delete participant' };
  }

  revalidatePath('/dashboard/participants');

  return {
    message: 'Participant deleted',
    participant: result,
  };
};

// Delete Multiple Participants
export const deleteParticipants = async (data: Participant[]) => {
  const idsToDelete = data.map((p) => p.id);

  const result = await safeLoader({
    outputValidation: z.object({
      count: z.number(),
    }),
    loader: () =>
      prisma.participant.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      }),
  });

  if (!result) {
    return { error: 'Failed to delete participants' };
  }

  revalidatePath('/dashboard/participants');

  return {
    message: 'Participants deleted',
    participant: result,
  };
};

// Update Participant
export const updateParticipant = async (
  identifier: string,
  newIdentifier: string,
) => {
  const result = await safeLoader({
    outputValidation: z.object({
      id: z.string(),
      identifier: z.string(),
    }),
    loader: () =>
      prisma.participant.update({
        where: { identifier },
        data: {
          identifier: newIdentifier,
        },
      }),
  });

  if (!result) {
    return { error: 'Failed to update participant' };
  }

  revalidatePath('/dashboard/participants');

  return {
    message: 'Participant updated',
    participant: result,
  };
};
