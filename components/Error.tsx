'use client';

import { Button } from '~/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { analytics } from '~/lib/analytics';

export default function Error({
  error,
  reset,
  heading,
}: {
  error: Error & { cause?: { code?: number } };
  reset: () => void;
  heading?: string;
}) {
  useEffect(() => {
    analytics.trackEvent({
      type: 'Error',
      error: {
        code: error.cause?.code || 500,
        message: error.message,
        details: JSON.stringify(error.cause) || '',
        stacktrace: error.stack || '',
        path: window.location.pathname,
      },
    });
  }, [heading, error]);

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
