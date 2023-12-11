'use client';

import Error from '~/components/Error';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string } & { cause?: { code?: number } };
  reset: () => void;
}) {
  return <Error error={error} reset={reset} heading="Global Error" />;
}
