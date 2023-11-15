'use client';
import { api } from '~/trpc/client';

import Error from '~/components/Error';
import { type ErrorPayload, trackError } from '@codaco/analytics';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const code = 123;
  const stacktrace = 'stacktrace';
  const appSettings = api.appSettings.get.useQuery();
  const errorPayload: ErrorPayload = {
    code: code,
    message: error.message,
    details: 'dashboard error',
    stacktrace: stacktrace,
    installationid: appSettings.data?.installationId ?? '',
    path: '/dashboard',
  };

  trackError(errorPayload).catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Error tracking error', e);
  });

  return <Error error={error} reset={reset} heading="Dashboard Error" />;
}
