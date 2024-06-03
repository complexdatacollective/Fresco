'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { UTApi } from 'uploadthing/server';
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
      prisma.asset.deleteMany(),
    ]);

    revalidatePath('/');
    revalidateTag('appSettings');
    revalidateTag('activityFeed');
    revalidateTag('summaryStatistics');
    revalidateTag('getProtocols');
    revalidateTag('getParticipants');
    revalidateTag('getInterviews');

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
