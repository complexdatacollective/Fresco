import { createId } from '@paralleldrive/cuid2';
import { redirect } from 'next/navigation';
import 'server-only';
import { type z } from 'zod';
import { createAppSetting } from '~/actions/appSettings';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { createCachedFunction } from '~/lib/cache';
import { type appSettingSchema } from '~/schemas/appSettings';
import { prisma } from '~/utils/db';

// Generic function to get an app setting
export async function getAppSetting<
  Key extends keyof z.infer<typeof appSettingSchema>,
>(key: Key): Promise<z.infer<typeof appSettingSchema>[Key]> {
  const initializedAt = await prisma.appSettings.findUnique({
    where: { key: 'initializedAt' },
  });

  if (!initializedAt) {
    // initialize the app
    // todo: should these come from fresco.config?
    await createAppSetting('initializedAt', new Date());
    await createAppSetting('configured', false);
    await createAppSetting('allowAnonymousRecruitment', false);
    await createAppSetting('limitInterviews', true);
    await createAppSetting('installationId', createId());
  }

  const keyValue = await prisma.appSettings.findUnique({
    where: { key },
  });

  if (!keyValue) {
    return null;
  }

  // Parse the value based on the expected type
  const parsedValue =
    key === 'initializedAt'
      ? new Date(keyValue.value)
      : keyValue.value === 'true'
        ? true
        : keyValue.value === 'false'
          ? false
          : keyValue.value;

  return parsedValue as z.infer<typeof appSettingSchema>[Key];
}

const calculateIsExpired = (configured: boolean, initializedAt: Date) =>
  !configured && initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

export async function requireAppNotExpired(isSetupRoute = false) {
  const configured = await getAppSetting('configured');
  const initializedAt = await getAppSetting('initializedAt');
  const expired = calculateIsExpired(configured, initializedAt);

  if (expired) {
    redirect('/expired');
  }

  // If we are on the setup route, don't do any further redirection;
  if (isSetupRoute) {
    return;
  }

  if (!configured) {
    redirect('/setup');
  }

  return;
}

// Used to prevent user account creation after the app has been configured
export async function requireAppNotConfigured() {
  const configured = await getAppSetting('configured');

  if (configured) {
    redirect('/');
  }

  return;
}

export const getAnonymousRecruitmentStatus = createCachedFunction(async () => {
  const getAnonymousRecruitmentStatus = await getAppSetting(
    'allowAnonymousRecruitment',
  );
  return getAnonymousRecruitmentStatus;
}, ['allowAnonymousRecruitment', 'appSettings']);

export const getLimitInterviewsStatus = createCachedFunction(async () => {
  const limitInterviews = await getAppSetting('limitInterviews');
  return limitInterviews;
}, ['limitInterviews', 'appSettings']);

export const getUploadthingVariables = createCachedFunction(async () => {
  const UPLOADTHING_SECRET = await getAppSetting('UPLOADTHING_SECRET');
  const UPLOADTHING_APP_ID = await getAppSetting('UPLOADTHING_APP_ID');

  return {
    UPLOADTHING_SECRET,
    UPLOADTHING_APP_ID,
  };
}, ['getUploadthingVariables']);

export const getInstallationId = createCachedFunction(async () => {
  const installationId = await getAppSetting('installationId');
  return installationId;
}, ['getInstallationId']);

export const getPublicUrl = createCachedFunction(async () => {
  const publicUrl = await getAppSetting('PUBLIC_URL');
  return publicUrl;
}, ['getPublicUrl']);

export const getSandboxMode = createCachedFunction(async () => {
  const sandboxMode = await getAppSetting('SANDBOX_MODE');
  return sandboxMode;
}, ['getSandboxMode']);

export const getDisableAnalytics = createCachedFunction(async () => {
  const disableAnalytics = await getAppSetting('DISABLE_ANALYTICS');
  return disableAnalytics;
}, ['getDisableAnalytics']);
