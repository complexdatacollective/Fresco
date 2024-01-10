'use server';

import { makeEventTracker } from '@codaco/analytics';
import { cache } from 'react';
import { env } from '~/env.mjs';
import { getAppSettings } from '~/server/routers/appSettings';

export const getInstallationId = cache(async () => {
  const appSettings = await getAppSettings();

  return appSettings?.installationId ?? 'Unknown';
});

export const trackEvent = !env.DISABLE_ANALYTICS
  ? makeEventTracker()
  : () => null;
