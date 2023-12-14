import { makeEventTracker } from '@codaco/analytics';
import { cache } from 'react';
import { api } from '~/trpc/server';
import { getBaseUrl } from '~/trpc/shared';

export const getInstallationId = cache(async () => {
  const installationId = await api.appSettings.getInstallationId.query();

  if (installationId) {
    return installationId;
  }

  return 'Unknown';
});

// eslint-disable-next-line no-process-env
const globalAnalyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;

export const trackEvent =
  globalAnalyticsEnabled !== 'false'
    ? makeEventTracker({
        endpoint: getBaseUrl() + '/api/analytics',
      })
    : () => {};
