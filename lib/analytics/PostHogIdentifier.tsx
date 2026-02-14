'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';
import { APP_NAME } from '~/fresco.config';

export default function PostHogIdentifier({
  installationId,
  disableAnalytics,
}: {
  installationId: string;
  disableAnalytics: boolean;
}) {
  useEffect(() => {
    posthog.register({
      app: APP_NAME,
      installation_id: installationId,
    });

    posthog.identify(
      installationId, // Replace 'distinct_id' with your user's unique identifier
    );
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
