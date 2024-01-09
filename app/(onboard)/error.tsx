'use client'; // Error components must be Client components
import Error from '~/components/Error';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { cause?: { code?: number } };
  reset: () => void;
}) {
  return <Error error={error} reset={reset} heading="Onboard error" />;
}
