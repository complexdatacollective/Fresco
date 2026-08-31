import { type Instrumentation } from 'next';

export async function register() {
  // eslint-disable-next-line no-process-env
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Dynamic import to avoid pulling Prisma (node:path, node:url, etc.)
  // into the Edge Instrumentation bundle
  const { installProcessErrorReporting } = await import('./lib/posthog-server');

  installProcessErrorReporting();
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
    const {
      flushPostHog,
      getPostHogServer,
      getPostHogSessionProperties,
      isAnalyticsDisabledUncached,
      POSTHOG_SESSION_ID_HEADER,
      resolveInstallationIdUncached,
    } = await import('./lib/posthog-server');
    const { POSTHOG_APP_PROPERTIES } = await import('./fresco.config');

    if (await isAnalyticsDisabledUncached()) {
      return;
    }

    const posthog = getPostHogServer();
    const distinctId = await resolveInstallationIdUncached();

    posthog.captureException(err, distinctId, {
      ...context,
      ...getPostHogSessionProperties(
        request.headers[POSTHOG_SESSION_ID_HEADER],
      ),
      ...POSTHOG_APP_PROPERTIES,
      installation_id: distinctId,
      $source: 'server',
    });

    await flushPostHog();
  }
};
