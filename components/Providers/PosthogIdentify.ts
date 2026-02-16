'use client';

import posthog from 'posthog-js';
import { use, useEffect } from 'react';
import { POSTHOG_APP_NAME } from '~/fresco.config';

/**
 * Adds the installation ID and app name as super properties to all PostHog events,
 * and identifies the user by installation ID.
 */
export function PostHogIdentify({
  installationId,
}: {
  installationId: Promise<string | undefined>;
}) {
  const resolvedId = use(installationId);

  useEffect(() => {
    if (!resolvedId) return;

    posthog.register({
      app: POSTHOG_APP_NAME,
      installation_id: resolvedId,
    });

    posthog.identify(resolvedId);
  }, [resolvedId]);

  return null;
}
