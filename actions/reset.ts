'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { env } from 'process';
import { CacheTags, safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { getUTApi } from '~/lib/uploadthing/server-helpers';
import { requireApiAuth } from '~/utils/auth';

export const resetAppSettings = async () => {
  if (env.NODE_ENV !== 'development') {
    await requireApiAuth();
  }

  try {
    // Delete all data:
    const result = await Promise.all([
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
    safeRevalidateTag(CacheTags);

    const utapi = await getUTApi();

    // Remove all files from UploadThing:
    await utapi.listFiles({}).then(({ files }) => {
      const keys = files.map((file) => file.key);
      return utapi.deleteFiles(keys);
    });
  } catch (error) {
    throw new Error(
      'Failed to reset app settings: ' + (error as Error).message,
    );
  } finally {
    redirect('/setup');
  }
};
