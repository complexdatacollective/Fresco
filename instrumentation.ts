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
    const { getPostHogServer, shutdownPostHog } =
      await import('./lib/posthog-server');
    const { env } = await import('./env');
    const { prisma } = await import('./lib/db');

    const posthog = getPostHogServer();

    // Query installation ID directly instead of using the cached query
    // from queries/appSettings. The cached version uses 'use cache' +
    // cacheLife(), which isn't available in the instrumentation context.
    let distinctId = env.INSTALLATION_ID;
    if (!distinctId) {
      const result = await prisma.appSettings.findUnique({
        where: { key: 'installationId' },
      });
      distinctId = result?.value ?? 'unknown';
    }

    posthog.captureException(err, distinctId, {
      ...context,
      $source: 'server',
    });

    await shutdownPostHog();
  }
};
