'use sever';

import { revalidatePath } from 'next/cache';
import type { Activity, ActivityType } from '~/lib/data-table/types';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

export async function addEvent(
  type: ActivityType,
  message: Activity['message'],
) {
  await requireApiAuth();

  try {
    await prisma.events.create({
      data: {
        type,
        message,
      },
    });

    revalidatePath('/dashboard');

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: 'Failed to add event' };
  }
}
