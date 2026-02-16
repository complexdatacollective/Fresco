// lib/posthog-server.ts
import { PostHog } from 'posthog-node';
import {
  POSTHOG_API_KEY,
  POSTHOG_APP_NAME,
  POSTHOG_PROXY_HOST,
} from '~/fresco.config';

let client: PostHog | null = null;

export function getPosthogServer() {
  client ??= new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_PROXY_HOST,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });
  return client;
}

// Dynamic import to avoid pulling Prisma (node:path, node:url, etc.)
// into Edge-compatible bundles that import this module
async function resolveInstallationId() {
  const { getInstallationId } = await import('~/queries/appSettings');
  return getInstallationId();
}

export async function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  const distinctId = await resolveInstallationId();
  const client = getPosthogServer();

  client.capture({
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
  const distinctId = await resolveInstallationId();
  const client = getPosthogServer();

  client.captureException(error, distinctId, properties);
}

export async function shutdownPostHog() {
  await getPosthogServer().shutdown();
}
