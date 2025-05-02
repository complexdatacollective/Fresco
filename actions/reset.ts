'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { env } from 'process';
import { safeRevalidateTag } from '~/lib/cache';
import { getUTApi } from '~/lib/uploadthing-server-helpers';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/utils/db';

export const resetAppSettings = async () => {
  const isPlaywrightTest = headers().get('x-playwright-test') === 'true';

  // eslint-disable-next-line no-console
  console.log('🎭 Playwright test header🎭', isPlaywrightTest);

  if (env.NODE_ENV !== 'development') {
    await requireApiAuth();
  }

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

    const utapi = await getUTApi();

    // Remove all files from UploadThing:

    if (!isPlaywrightTest) {
      await utapi.listFiles({}).then(({ files }) => {
        const keys = files.map((file) => file.key);
        return utapi.deleteFiles(keys);
      });
    }

    return { error: null, appSettings: null };
  } catch (error) {
    return { error: 'Failed to reset appSettings', appSettings: null };
  }
};
