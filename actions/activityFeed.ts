'use server';

import type { Activity } from '~/app/dashboard/_components/ActivityFeed/types';
import { requireApiAuth } from '~/lib/auth/guards';
import { prisma } from '~/lib/db';

export async function getActivitiesForExport(): Promise<Activity[]> {
  await requireApiAuth();

  return prisma.events.findMany({
    select: { id: true, timestamp: true, type: true, message: true },
    orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
  });
}
