'use client';

import Error from '~/components/Error';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { cause?: { code?: number } };
  reset: () => void;
}) {
  return <Error error={error} reset={reset} heading="API Error" />;
}
