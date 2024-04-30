'use server';

import { redirect } from 'next/navigation';
import { prisma } from '~/utils/db';
import { utapi } from '../app/api/uploadthing/core';
import { revalidatePath } from 'next/cache';
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

    // Remove all files from UploadThing:
    await utapi.listFiles({}).then((assets) => {
      const keys = assets.map((asset) => asset.key);
      return utapi.deleteFiles(keys);
    });
  } catch (error) {
    return { error: 'Failed to reset appSettings', appSettings: null };
  }
};
