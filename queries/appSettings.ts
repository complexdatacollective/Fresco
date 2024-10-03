import { createId } from '@paralleldrive/cuid2';
import { redirect } from 'next/navigation';
import 'server-only';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/utils/db';

type AppSettingsKeys =
  | 'configured'
  | 'allowAnonymousRecruitment'
  | 'limitInterviews'
  | 'initializedAt'
  | 'installationId';

type AppSettings = Record<AppSettingsKeys, string>;

const DEFAULT_SETTINGS: Record<AppSettingsKeys, string> = {
  configured: 'false',
  allowAnonymousRecruitment: 'false',
  limitInterviews: 'true',
  initializedAt: new Date().toISOString(),
  installationId: createId(),
};

const calculateIsExpired = (configured: boolean, initializedAt: Date) =>
  !configured && initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

const getAppSettings = createCachedFunction(async () => {
  const appSettingsRecords = await prisma.appSettings.findMany({
    select: { key: true, value: true },
  });

  // Check if there are any existing settings
  if (appSettingsRecords.length === 0) {
    // No app settings exist, so create all default settings
    await prisma.appSettings.createMany({
      data: Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
        key: key as AppSettingsKeys,
        value,
      })),
    });

    return {
      ...DEFAULT_SETTINGS,
      configured: DEFAULT_SETTINGS.configured === 'true',
      allowAnonymousRecruitment:
        DEFAULT_SETTINGS.allowAnonymousRecruitment === 'true',
      limitInterviews: DEFAULT_SETTINGS.limitInterviews === 'true',
      initializedAt: new Date(DEFAULT_SETTINGS.initializedAt),
      expired: calculateIsExpired(
        DEFAULT_SETTINGS.configured === 'true',
        new Date(DEFAULT_SETTINGS.initializedAt),
      ),
    };
  }

  const appSettings = appSettingsRecords.reduce((acc, { key, value }) => {
    acc[key as AppSettingsKeys] = value;
    return acc;
  }, {} as AppSettings);

  return {
    configured: appSettings.configured === 'true',
    allowAnonymousRecruitment: appSettings.allowAnonymousRecruitment === 'true',
    limitInterviews: appSettings.limitInterviews === 'true',
    initializedAt: new Date(appSettings.initializedAt),
    installationId: appSettings.installationId,
    expired: calculateIsExpired(
      appSettings.configured === 'true',
      new Date(appSettings.initializedAt),
    ),
  };
}, ['appSettings', 'allowAnonymousRecruitment', 'limitInterviews']);

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

// Used to prevent user account creation after the app has been configured
export async function requireAppNotConfigured() {
  const appSettings = await getAppSettings();

  if (appSettings.configured) {
    redirect('/');
  }

  return;
}

export async function isAppExpired() {
  const appSettings = await getAppSettings();
  return appSettings.expired;
}

export const getAnonymousRecruitmentStatus = createCachedFunction(async () => {
  const appSettings = await getAppSettings();

  return appSettings.allowAnonymousRecruitment;
}, ['allowAnonymousRecruitment', 'appSettings']);

export const getLimitInterviewsStatus = createCachedFunction(async () => {
  const appSettings = await getAppSettings();

  return appSettings.limitInterviews;
}, ['limitInterviews', 'appSettings']);

export const getUploadthingVariables = createCachedFunction(async () => {
  const keyValues = await prisma.appSettings.findMany({
    where: {
      key: {
        in: ['UPLOADTHING_SECRET', 'UPLOADTHING_APP_ID'],
      },
    },
  });

  const uploadthingVariables = keyValues.reduce(
    (acc, { key, value }) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    UPLOADTHING_SECRET: uploadthingVariables.UPLOADTHING_SECRET ?? null,
    UPLOADTHING_APP_ID: uploadthingVariables.UPLOADTHING_APP_ID ?? null,
  };
}, ['getUploadthingVariables']);

export const getInstallationId = createCachedFunction(async () => {
  const keyValues = await prisma.appSettings.findMany({
    where: {
      key: 'INSTALLATION_ID',
    },
  });

  return keyValues[0]?.value ?? null;
}, ['getInstallationId']);

export const getPublicUrl = createCachedFunction(async () => {
  const keyValues = await prisma.appSettings.findMany({
    where: {
      key: 'PUBLIC_URL',
    },
  });

  return keyValues[0]?.value ?? null;
}, ['getPublicUrl']);

export const getSandboxMode = createCachedFunction(async () => {
  const keyValues = await prisma.appSettings.findMany({
    where: {
      key: 'SANDBOX_MODE',
    },
  });

  return keyValues[0]?.value === 'true';
}, ['getSandboxMode']);

export const getDisableAnalytics = createCachedFunction(async () => {
  const keyValues = await prisma.appSettings.findMany({
    where: {
      key: 'DISABLE_ANALYTICS',
    },
  });

  return keyValues[0]?.value === 'true';
}, ['getDisableAnalytics']);
