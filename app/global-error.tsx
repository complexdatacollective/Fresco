'use client';

import { trackEvent } from '~/analytics/utils';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (error) {
    void trackEvent({
      type: 'Error',
      name: error.name,
      message: error.message,
      stack: error.stack,
      metadata: {
        digest: error.digest,
        origin: 'global-error.tsx',
      },
    });
  }

  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
      </body>
    </html>
  );
}
