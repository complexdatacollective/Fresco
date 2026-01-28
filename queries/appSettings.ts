'use server';

import { redirect } from 'next/navigation';
import 'server-only';
import { type z } from 'zod';
import { env } from '~/env';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { createCachedFunction } from '~/lib/cache';
import { prisma } from '~/lib/db';
import {
  type AppSetting,
  appSettingPreprocessedSchema,
} from '~/schemas/appSettings';

export const getAppSetting = <Key extends AppSetting>(
  key: Key,
): Promise<z.infer<typeof appSettingPreprocessedSchema>[Key]> =>
  createCachedFunction(
    async (key: AppSetting): Promise<string | null> => {
      const result = await prisma.appSettings.findUnique({
        where: { key },
      });

      // Return raw value (string or null) for caching
      return result?.value ?? null;
    },
    [`appSettings-${key}`, 'appSettings'],
  )(key).then((rawValue) => {
    // Parse the cached raw value to the correct type
    // Convert null to undefined so schema defaults work correctly
    const parsedValue = appSettingPreprocessedSchema.shape[key].parse(
      rawValue ?? undefined,
    );

    return parsedValue as z.infer<typeof appSettingPreprocessedSchema>[Key];
  });

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

async function isAppExpired() {
  const isConfigured = await getAppSetting('configured');
  const initializedAt = await getAppSetting('initializedAt');

  // If initializedAt is null, app can't be expired
  if (!initializedAt) {
    return false;
  }

  return (
    !isConfigured && initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT
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

// Unique fetcher for installationID, which defers to the environment variable
// if set, and otherwise fetches from the database
export async function getInstallationId() {
  if (env.INSTALLATION_ID) {
    return env.INSTALLATION_ID;
  }

  return getAppSetting('installationId');
}

// Unique fetcher for disableAnalytics, which defers to the environment variable
// if set, and otherwise fetches from the database
export async function getDisableAnalytics() {
  if (env.DISABLE_ANALYTICS) {
    return env.DISABLE_ANALYTICS;
  }

  return getAppSetting('disableAnalytics');
}
