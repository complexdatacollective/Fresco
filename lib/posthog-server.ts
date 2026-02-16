// lib/posthog-server.ts
import { PostHog } from 'posthog-node';
import {
  POSTHOG_API_KEY,
  POSTHOG_APP_NAME,
  POSTHOG_PROXY_HOST,
} from '~/fresco.config';
import { getInstallationId } from '~/queries/appSettings';

let client: PostHog | null = null;

function getClient() {
  client ??= new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_PROXY_HOST,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });
  return client;
}

export async function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  const distinctId = await getInstallationId();
  getClient().capture({
    distinctId,
    event,
    properties: {
      app: POSTHOG_APP_NAME,
      installation_id: distinctId,
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
