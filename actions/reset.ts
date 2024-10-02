'use server';

import { revalidatePath } from 'next/cache';
import { UTApi } from 'uploadthing/server';
import { safeRevalidateTag } from '~/lib/cache';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

export const resetAppSettings = async () => {
  await requireApiAuth();

  try {
    // Delete all data:
    await Promise.all([
      prisma.user.deleteMany(), // Deleting a user will cascade to Session and Key
      prisma.participant.deleteMany(),
      prisma.protocol.deleteMany(), // Deleting protocol will cascade to Interviews
      prisma.appSettings.deleteMany(),
      prisma.events.deleteMany(),
      prisma.environment.deleteMany(),
      prisma.asset.deleteMany(),
    ]);

    revalidatePath('/');
    safeRevalidateTag('appSettings');
    safeRevalidateTag('activityFeed');
    safeRevalidateTag('summaryStatistics');
    safeRevalidateTag('getProtocols');
    safeRevalidateTag('getParticipants');
    safeRevalidateTag('getInterviews');
    safeRevalidateTag('getSandboxMode');
    safeRevalidateTag('getDisableAnalytics');

    const utapi = new UTApi();

    // Remove all files from UploadThing:
    await utapi.listFiles({}).then(({ files }) => {
      const keys = files.map((file) => file.key);
      return utapi.deleteFiles(keys);
    });

    return { error: null, appSettings: null };
  } catch (error) {
    return { error: 'Failed to reset appSettings', appSettings: null };
  }
};
