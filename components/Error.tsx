'use client';

import { useEffect } from 'react';
import { Button } from '~/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { type ErrorPayload, trackError } from '@codaco/analytics';
import { api } from '~/trpc/client';

export default function Error({
  error,
  reset,
  heading,
}: {
  error: Error;
  reset: () => void;
  heading?: string;
}) {
  const code = 123;
  const stacktrace = 'stacktrace';
  const appSettings = api.appSettings.get.useQuery();

  useEffect(() => {
    // Log the error to an error reporting service
    const errorPayload: ErrorPayload = {
      code: code,
      message: error.message,
      details: heading ? heading : '',
      stacktrace: stacktrace,
      installationid: appSettings.data?.installationId ?? '',
      path: '/interview',
    };
    trackError(errorPayload).catch((e) => {
      // eslint-disable-next-line no-console
      console.error('Error tracking error', e);
    });
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error, appSettings.data?.installationId, heading]);

  return (
    <div className="mx-auto my-4 flex max-w-md flex-col items-center rounded-lg border border-destructive p-4 text-center">
      <AlertTriangle className="mb-2 h-12 w-12 text-destructive" />
      <h2 className="mb-2 text-2xl font-semibold text-destructive">
        {heading || 'Something went wrong'}
      </h2>
      <p className="text-sm">{error.message}</p>
      <div className="mt-4">
        <Button onClick={() => reset()}>Try Again</Button>
      </div>
    </div>
  );
}
