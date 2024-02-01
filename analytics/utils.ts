import { makeEventTracker } from '@codaco/analytics';
import { cache } from 'react';
import { env } from '~/env.mjs';
import { prisma } from '~/utils/db';

export const getInstallationId = cache(async () => {
  if (env.INSTALLATION_ID) {
    return env.INSTALLATION_ID;
  }

  // eslint-disable-next-line local-rules/require-data-mapper
  const appSettings = await prisma.appSettings.findFirst();

  return appSettings?.installationId ?? 'Unknown';
});

export const trackEvent = makeEventTracker({
  enabled: !!env.DISABLE_ANALYTICS,
});
