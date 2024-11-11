'use server';

import { revalidatePath } from 'next/cache';
import { env } from 'process';
import { UTApi } from 'uploadthing/server';
import { safeRevalidateTag } from '~/lib/cache';
import { getAppSetting } from '~/queries/appSettings';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

export const resetAppSettings = async () => {
  if (env.NODE_ENV !== 'development') {
    await requireApiAuth();
  }

  const UPLOADTHING_TOKEN = await getAppSetting('uploadThingToken');

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

    // add a new initializedAt date
    await prisma.appSettings.create({
      data: {
        key: 'initializedAt',
        value: new Date().toISOString(),
      },
    });

    revalidatePath('/');
    safeRevalidateTag('appSettings');
    safeRevalidateTag('activityFeed');
    safeRevalidateTag('summaryStatistics');
    safeRevalidateTag('getProtocols');
    safeRevalidateTag('getParticipants');
    safeRevalidateTag('getInterviews');

    const utapi = new UTApi({
      token: UPLOADTHING_TOKEN,
    });

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
