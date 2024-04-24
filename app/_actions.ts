'use server';

import * as context from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '~/utils/auth';
import { prisma } from '~/utils/db';
import { utapi } from './api/uploadthing/core';
import { revalidatePath } from 'next/cache';

export const resetAppSettings = async () => {
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

export const setAppConfigured = async () => {
  try {
    await prisma.appSettings.updateMany({
      data: {
        configured: true,
      },
    });
  } catch (error) {
    return { error: 'Failed to update appSettings', appSettings: null };
  }
  redirect('/dashboard');
};

export async function logoutAction() {
  const authRequest = auth.handleRequest('POST', context);

  const session = await authRequest.validate();

  if (!session) {
    return;
  }

  await auth.invalidateSession(session.sessionId);
  authRequest.setSession(null);

  return redirect('/signin');
}
