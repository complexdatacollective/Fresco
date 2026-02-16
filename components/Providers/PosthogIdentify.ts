'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';
import { POSTHOG_APP_NAME } from '~/fresco.config';

/**
 * Adds the installation ID and app name as super properties to all PostHog events,
 * identifies the user by installation ID, and respects the disableAnalytics setting.
 */
export function PostHogIdentify({
  installationId,
  disableAnalytics,
}: {
  installationId?: string;
  disableAnalytics?: boolean;
}) {
  useEffect(() => {
    if (disableAnalytics) {
      posthog.opt_out_capturing();
      return;
    }

    posthog.opt_in_capturing();

    if (!installationId) return;

    posthog.register({
      app: POSTHOG_APP_NAME,
      installation_id: installationId,
    });

    posthog.identify(installationId);
  }, [installationId, disableAnalytics]);

  return null;
}
