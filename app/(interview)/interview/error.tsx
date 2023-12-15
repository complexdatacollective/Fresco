'use client';

import Error from '~/components/Error';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <Error error={error} reset={reset} heading="Interview Error" />;
}
