import { redirect } from 'next/navigation';
import 'server-only';
import { type z } from 'zod';
import { env } from '~/env';
import { UNCONFIGURED_TIMEOUT } from '~/fresco.config';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import {
  type AppSetting,
  appSettingPreprocessedSchema,
} from '~/schemas/appSettings';

async function getCachedAppSettingRaw(key: AppSetting): Promise<string | null> {
  'use cache';
  safeCacheTag([`appSettings-${key}`, 'appSettings']);

  const result = await prisma.appSettings.findUnique({
    where: { key },
  });

  return result?.value ?? null;
}

export async function getAppSetting<Key extends AppSetting>(
  key: Key,
): Promise<z.infer<typeof appSettingPreprocessedSchema>[Key]> {
  const rawValue = await getCachedAppSettingRaw(key);

  // Parse the cached raw value to the correct type
  // Convert null to undefined so schema defaults work correctly
  const parsedValue = appSettingPreprocessedSchema.shape[key].parse(
    rawValue ?? undefined,
  );

  return parsedValue as z.infer<typeof appSettingPreprocessedSchema>[Key];
}

export async function requireAppNotExpired(isSetupRoute = false) {
  // Fetch both settings in parallel to avoid sequential database calls
  const [isConfigured, initializedAt] = await Promise.all([
    getAppSetting('configured'),
    getAppSetting('initializedAt'),
  ]);

  // Check if app is expired (unconfigured and past timeout)
  const expired =
    !isConfigured &&
    initializedAt !== null &&
    initializedAt.getTime() < Date.now() - UNCONFIGURED_TIMEOUT;

  if (expired) {
    redirect('/expired');
  }

  // If we are on the setup route, don't do any further redirection;
  if (isSetupRoute) {
    return;
  }

  if (!isConfigured) {
    redirect('/setup');
  }

  return;
}

// Used to prevent user account creation after the app has been configured
export async function requireAppNotConfigured() {
  // Allow visiting /setup in development even after configuration
  if (env.NODE_ENV === 'development') {
    return;
  }

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

// Unique fetcher for previewMode, which defers to the environment variable
// if set, and otherwise fetches from the database
export async function getPreviewMode() {
  if (env.PREVIEW_MODE !== undefined) {
    return env.PREVIEW_MODE;
  }

  return getAppSetting('previewMode');
}
