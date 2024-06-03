'use sever';

import { revalidateTag } from 'next/cache';
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

    revalidateTag('activityFeed');

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: 'Failed to add event' };
  }
}
