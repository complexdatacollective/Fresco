'use server';

import type { Activity, ActivityType } from '~/components/DataTable/types';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';

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

    safeUpdateTag('activityFeed');

    return { success: true, error: null };
  } catch (_error) {
    return { success: false, error: 'Failed to add event' };
  }
}
