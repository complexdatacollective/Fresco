'use client';

import { Button } from '~/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { trackEvent } from '~/analytics/utils';

export default function Error({
  error,
  reset,
  heading,
}: {
  error: Error;
  reset: () => void;
  heading?: string;
}) {
  useEffect(() => {
    const sendEvent = async () => {
      try {
        await trackEvent({
          type: 'Error',
          error: {
            message: error.message,
            details: heading ?? '',
            stacktrace: error.stack ?? '',
            path: window.location.pathname,
          },
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    };

    void sendEvent();
  }, [heading, error]);

  return (
    <div className="mx-auto my-4 flex max-w-md flex-col items-center rounded-lg border border-destructive p-4 text-center">
      <AlertTriangle className="mb-2 h-12 w-12 text-destructive" />
      <h2 className="mb-2 text-2xl font-semibold text-destructive">
        {heading ?? 'Something went wrong'}
      </h2>
      <p className="text-sm">{error.message}</p>
      <div className="mt-4">
        <Button onClick={() => reset()}>Try Again</Button>
      </div>
    </div>
  );
}
