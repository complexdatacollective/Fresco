import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import 'server-only';
import { env } from '~/env';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { prisma } from '~/utils/db';

const calculateIsExpired = (configured: boolean, initializedAt: Date) =>
  !configured && initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

const getAppSettings = unstable_cache(
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
    const appSettings = await getAppSettings();

    return !!appSettings?.allowAnonymousRecruitment;
  },
  ['allowAnonymousRecruitment'],
  { tags: ['appSettings', 'allowAnonymousRecruitment'] },
);

export const getLimitInterviewsStatus = unstable_cache(
  async () => {
    const appSettings = await getAppSettings();

    return !!appSettings?.limitInterviews;
  },
  ['limitInterviews'],
  {
    tags: ['appSettings', 'limitInterviews'],
  },
);

export const getInstallationId = unstable_cache(
  async () => {
    if (env.INSTALLATION_ID) {
      return env.INSTALLATION_ID;
    }

    const appSettings = await getAppSettings();

    return appSettings?.installationId ?? 'Unknown';
  },
  ['getInstallationId'],
  { tags: ['getInstallationId', 'appSettings'] },
);
