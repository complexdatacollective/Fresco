// lib/posthog-server.ts
import { POSTHOG_API_KEY, POSTHOG_PROXY_HOST } from '@/fresco.config';
import { getInstallationId } from '@/lib/installation'; // your DB call
import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

function getClient(): PostHog {
  if (!client) {
    client = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_PROXY_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

const SUPER_PROPERTIES = {
  app_name: 'fresco',
  // etc.
};

export async function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  const distinctId = await getInstallationId();
  getClient().capture({
    distinctId,
    event,
    properties: {
      ...SUPER_PROPERTIES,
      ...properties,
      $source: 'server',
    },
  });
}

export async function captureException(
  error: unknown,
  properties?: Record<string, unknown>,
) {
  await captureEvent('$exception', {
    ...properties,
    $exception_message: error instanceof Error ? error.message : String(error),
    $exception_type:
      error instanceof Error ? error.constructor.name : 'Unknown',
    $exception_stack_trace_raw:
      error instanceof Error ? error.stack : undefined,
  });
}

export async function shutdownPostHog() {
  await getClient().shutdown();
}
