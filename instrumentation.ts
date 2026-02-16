import { type Instrumentation } from 'next';
import { getPosthogServer } from './lib/posthog-server';
import { getInstallationId } from './queries/appSettings';

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
    const posthog = getPosthogServer();
    const distinctId = await getInstallationId();

    posthog.captureException(err, distinctId, {
      ...context,
      $source: 'server',
    });
  }
};
