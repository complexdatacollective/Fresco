'use client';

import Error from '~/components/Error';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <Error error={error} reset={reset} heading="Global Error" />;
}
