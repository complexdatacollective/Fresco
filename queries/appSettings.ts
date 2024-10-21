import { redirect } from 'next/navigation';
import 'server-only';
import { type z } from 'zod';
import { initializeWithDefaults } from '~/actions/appSettings';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { createCachedFunction } from '~/lib/cache';
import { appSettingPreprocessedSchema } from '~/schemas/appSettings';
import { prisma } from '~/utils/db';

export const getAppSetting = <
  Key extends keyof z.infer<typeof appSettingPreprocessedSchema>,
>(
  key: Key,
) =>
  createCachedFunction(
    async (key: Key) => {
      const configured = await prisma.appSettings.findUnique({
        where: { key: 'configured' },
      });

      // If there is no app setting for 'configured', then the app has not been initialized with defaults
      if (configured === null) {
        const data = await initializeWithDefaults();

        const initializedSetting = data.find((item) => item.key === key);

        if (!initializedSetting) {
          return null;
        }

        // Parse the value using the preprocessed schema
        const parsedInitializedValue = appSettingPreprocessedSchema.shape[
          key
        ].parse(initializedSetting.value);

        return parsedInitializedValue as z.infer<
          typeof appSettingPreprocessedSchema
        >[Key];
      }

      // From here, we know that the app has been initialized
      const keyValue = await prisma.appSettings.findUnique({
        where: { key },
      });

      if (!keyValue) {
        return null;
      }

      // Parse the value using the preprocessed schema
      const parsedValue = appSettingPreprocessedSchema.shape[key].parse(
        keyValue.value,
      );

      return parsedValue as z.infer<typeof appSettingPreprocessedSchema>[Key];
    },
    [`appSettings-${key}`, 'appSettings'],
  )(key);

const calculateIsExpired = (
  configured: boolean | null,
  initializedAt: Date | null,
) => {
  if (!initializedAt) {
    return false;
  }
  return (
    !configured &&
    new Date(initializedAt).getTime() < Date.now() - UNCONFIGURED_TIMEOUT
  );
};

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

export async function isAppExpired() {
  const configured = await getAppSetting('configured');
  const initializedAt = await getAppSetting('initializedAt');

  if (!configured || !initializedAt) {
    throw new Error('Could not get app settings');
  }
  return calculateIsExpired(configured, initializedAt);
}

// Used to prevent user account creation after the app has been configured
export async function requireAppNotConfigured() {
  const configured = await getAppSetting('configured');

  if (configured) {
    redirect('/');
  }

  return;
}
