'use server';

import { type Participant } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '~/utils/db';
import { safeLoader } from '~/utils/safeLoader';

export const createParticipant = async (formData: FormData) => {
  const identifier = formData.get('identifier');

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

export const deleteParticipants = (selectedParticipants: Participant[]) => {
  console.log(selectedParticipants);
};

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
