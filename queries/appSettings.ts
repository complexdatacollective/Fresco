import { revalidatePath, unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { prisma } from '~/utils/db';

const calculateIsExpired = (configured: boolean, initializedAt: Date) =>
  !configured && initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

export const getAppSettings = cache(async () => {
  const appSettings = await prisma.appSettings.findFirst();

  // If there are no app settings, create them
  if (!appSettings) {
    const newAppSettings = await createAppSettings();

    if (newAppSettings.error ?? !newAppSettings.appSettings) {
      throw new Error('Failed to create app settings');
    }

    return {
      ...newAppSettings.appSettings,
      expired: calculateIsExpired(
        newAppSettings.appSettings.configured,
        newAppSettings.appSettings.initializedAt,
      ),
    };
  }

  return {
    ...appSettings,
    expired: calculateIsExpired(
      appSettings.configured,
      appSettings.initializedAt,
    ),
  };
});

// Not exported because it should only be called internally.
async function createAppSettings() {
  try {
    const appSettings = await prisma.appSettings.create({
      data: {
        initializedAt: new Date(),
      },
    });

    revalidatePath('/');
    return { error: null, appSettings };
  } catch (error) {
    return { error: 'Failed to create appSettings', appSettings: null };
  }
}

export async function requireAppNotExpired(isSetupRoute = false) {
  const appSettings = await getAppSettings();

  if (appSettings.expired) {
    redirect('/expired');
  }

  // If we are on the setup route, don't do any further redirection;
  if (isSetupRoute) {
    return;
  }

  if (!appSettings.configured) {
    redirect('/setup');
  }

  return;
}

export async function isAppExpired() {
  const appSettings = await getAppSettings();
  return appSettings.expired;
}

export const getAnonymousRecruitmentStatus = unstable_cache(async () => {
  const appSettings = await prisma.appSettings.findFirst({
    select: {
      allowAnonymousRecruitment: true,
    },
  });

  return !!appSettings?.allowAnonymousRecruitment;
}, ['anonymousRecruitmentStatus']);
