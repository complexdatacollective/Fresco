'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';
import { APP_NAME } from '~/fresco.config';

export default function PostHogIdentifier({
  installationId,
  disableAnalytics,
}: {
  installationId?: string;
  disableAnalytics: boolean;
}) {
  useEffect(() => {
    if (!installationId) return;

    posthog.register({
      app: APP_NAME,
      installation_id: installationId,
    });

    posthog.identify(installationId);
  }, [installationId]);

  useEffect(() => {
    if (disableAnalytics) {
      posthog.opt_out_capturing();
    } else {
      posthog.opt_in_capturing();
    }
  }, [disableAnalytics]);

  return null;
}
