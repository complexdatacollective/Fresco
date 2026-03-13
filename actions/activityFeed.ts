'use server';

import { after } from 'next/server';
import type {
  Activity,
  ActivityType,
} from '~/app/dashboard/_components/ActivityFeed/types';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { captureEvent, shutdownPostHog } from '~/lib/posthog-server';

export async function addEvent(
  type: ActivityType,
  message: Activity['message'],
  properties?: Record<string, unknown>,
) {
  try {
    await prisma.events.create({
      data: {
        type,
        message,
      },
    });

    safeUpdateTag('activityFeed');

    after(async () => {
      await captureEvent(type, { message, ...properties });
      await shutdownPostHog();
    });

    return { success: true, error: null };
  } catch (_error) {
    return { success: false, error: 'Failed to add event' };
  }
}
