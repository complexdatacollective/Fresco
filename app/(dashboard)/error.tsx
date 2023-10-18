'use client'; // Error components must be Client components

import { useEffect } from 'react';
import { Button } from '~/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="my-4 mx-auto p-4 rounded-lg border border-destructive max-w-md text-center flex flex-col items-center">
      <AlertTriangle className="text-destructive mb-2 h-12 w-12" />
      <h2 className="text-2xl font-semibold mb-2 text-destructive">Dashboard Error</h2>
      <p className="text-sm">{error.message}</p>
      <div className="mt-4">
        <Button onClick={() => reset()}>Try Again</Button>
      </div>
    </div>
  );
}
