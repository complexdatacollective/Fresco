import { type Instrumentation } from 'next';

export function register() {
  // No-op for initialization
}
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  // eslint-disable-next-line no-process-env
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamic imports to avoid pulling Prisma (node:path, node:url, etc.)
    // into the Edge Instrumentation bundle
    const { getPosthogServer } = await import('./lib/posthog-server');
    const { getInstallationId } = await import('./queries/appSettings');

    const posthog = getPosthogServer();
    const distinctId = await getInstallationId();

    posthog.captureException(err, distinctId, {
      ...context,
      $source: 'server',
    });
  }
};
