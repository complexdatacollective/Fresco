import { redirect } from 'next/navigation';
import 'server-only';
import { type z } from 'zod';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { createCachedFunction } from '~/lib/cache';
import {
  type AppSetting,
  appSettingPreprocessedSchema,
} from '~/schemas/appSettings';
import { prisma } from '~/utils/db';

export const getAppSetting = <Key extends AppSetting>(key: Key) =>
  createCachedFunction(
    async (key: Key) => {
      const keyValue = await prisma.appSettings.findUnique({
        where: { key: key as AppSetting },
      });

      // If the key does not exist, return the default value
      if (!keyValue) {
        const value = appSettingPreprocessedSchema.shape[key].parse(
          undefined,
        ) as z.infer<typeof appSettingPreprocessedSchema>[Key];
        return value;
      }

      // Parse the value using the preprocessed schema
      return appSettingPreprocessedSchema.shape[key].parse(
        keyValue.value,
      ) as z.infer<typeof appSettingPreprocessedSchema>[Key];
    },
    [`appSettings-${key}`, 'appSettings'],
  )(key);

export async function requireAppNotExpired(isSetupRoute = false) {
  const expired = await isAppExpired();

  if (expired) {
    redirect('/expired');
  }

  // If we are on the setup route, don't do any further redirection;
  if (isSetupRoute) {
    return;
  }

  const isConfigured = await getAppSetting('configured');

  if (!isConfigured) {
    redirect('/setup');
  }

  return;
}

export async function isAppExpired() {
  const isConfigured = await getAppSetting('configured');
  const initializedAt = await getAppSetting('initializedAt');

  return (
    !isConfigured &&
    new Date(initializedAt).getTime() < Date.now() - UNCONFIGURED_TIMEOUT
  );
}

// Used to prevent user account creation after the app has been configured
export async function requireAppNotConfigured() {
  const configured = await getAppSetting('configured');

  if (configured) {
    redirect('/');
  }

  return;
}
