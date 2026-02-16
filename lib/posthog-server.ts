// lib/posthog-server.ts
import { PostHog } from 'posthog-node';
import {
  POSTHOG_API_KEY,
  POSTHOG_APP_NAME,
  POSTHOG_PROXY_HOST,
} from '~/fresco.config';

let client: PostHog | null = null;

export function getPostHogServer() {
  client ??= new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_PROXY_HOST,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });
  return client;
}

// Dynamic imports to avoid pulling Prisma (node:path, node:url, etc.)
// into Edge-compatible bundles that import this module
async function resolveInstallationId() {
  const { getInstallationId } = await import('~/queries/appSettings');
  return getInstallationId();
}

async function isAnalyticsDisabled() {
  const { getDisableAnalytics } = await import('~/queries/appSettings');
  return getDisableAnalytics();
}

export async function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (await isAnalyticsDisabled()) return;

  const distinctId = await resolveInstallationId();
  const client = getPostHogServer();

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
  if (await isAnalyticsDisabled()) return;

  const distinctId = await resolveInstallationId();
  const client = getPostHogServer();

  client.captureException(error, distinctId, properties);
}

export async function shutdownPostHog() {
  if (client) {
    await client.shutdown();
    client = null;
  }
}
