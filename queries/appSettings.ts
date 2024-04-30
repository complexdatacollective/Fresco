import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { prisma } from '~/utils/db';
import 'server-only';

const calculateIsExpired = (configured: boolean, initializedAt: Date) =>
  !configured && initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

export const getAppSettings = unstable_cache(
  async () => {
    const appSettings = await prisma.appSettings.findFirst();

    // If there are no app settings, create them
    if (!appSettings) {
      const newAppSettings = await prisma.appSettings.create({
        data: {
          initializedAt: new Date(),
        },
      });

      return {
        ...newAppSettings,
        expired: calculateIsExpired(
          newAppSettings.configured,
          newAppSettings.initializedAt,
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
  },
  ['appSettings'],
  { tags: ['appSettings', 'allowAnonymousRecruitment', 'limitInterviews'] },
);

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

export const getAnonymousRecruitmentStatus = unstable_cache(
  async () => {
    const appSettings = await prisma.appSettings.findFirst({
      select: {
        allowAnonymousRecruitment: true,
      },
    });

    return !!appSettings?.allowAnonymousRecruitment;
  },
  ['allowAnonymousRecruitment'],
  { tags: ['appSettings', 'allowAnonymousRecruitment'] },
);

export const getLimitInterviewsStatus = unstable_cache(
  async () => {
    const appSettings = await prisma.appSettings.findFirst({
      select: {
        limitInterviews: true,
      },
    });

    return !!appSettings?.limitInterviews;
  },
  ['limitInterviews'],
  {
    tags: ['appSettings', 'limitInterviews'],
  },
);
