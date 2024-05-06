'use server';

import { prisma } from '~/utils/db';
import { utapi } from '../app/api/uploadthing/core';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireApiAuth } from '~/utils/auth';

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
