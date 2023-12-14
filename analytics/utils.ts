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

export const trackEvent = makeEventTracker({
  endpoint: getBaseUrl() + '/api/analytics',
});
