'use server';

import { safeRevalidateTag } from '~/lib/cache';
import type { Activity, ActivityType } from '~/lib/data-table/types';
import { prisma } from '~/utils/db';

export async function addEvent(
  type: ActivityType,
  message: Activity['message'],
) {
  try {
    await prisma.events.create({
      data: {
        type,
        message,
      },
    });

    safeRevalidateTag('activityFeed');

    return { success: true, error: null };
  } catch (_error) {
    return { success: false, error: 'Failed to add event' };
  }
}
