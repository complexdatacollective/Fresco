'use client';

import { useEffect } from 'react';
import { Button } from '~/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { sendError } from '~/utils/sendError';

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
    sendError({ error, heading }).catch((err) => {
      console.error(err);
    });
  }, [error, heading]);
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
