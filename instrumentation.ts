import { logs } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs';
import type { Instrumentation } from 'next';
import { PostHog } from 'posthog-node';
import { APP_NAME, POSTHOG_HOST, POSTHOG_KEY } from './fresco.config';
import { getAppSetting } from './queries/appSettings';

let posthog: PostHog | null = null;

function getPostHog() {
  posthog ??= new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST });
  return posthog;
}

// Create LoggerProvider outside register() so it can be exported and flushed in route handlers
export const loggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({ 'service.name': APP_NAME }),
  processors: [
    new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: POSTHOG_HOST,
        headers: {
          'Authorization': `Bearer ${POSTHOG_KEY}`,
          'Content-Type': 'application/json',
        },
      }),
    ),
  ],
});

export function register() {
  // eslint-disable-next-line no-process-env
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logs.setGlobalLoggerProvider(loggerProvider);
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  const installationId = await getAppSetting('installationId');

  if (!installationId) return;

  const ph = getPostHog();

  ph.captureException(err, 'server', {
    app: APP_NAME,
    installationId,
    request_path: request.path,
    request_method: request.method,
    route_path: context.routePath,
    route_type: context.routeType,
    render_source: context.renderSource,
  });

  await ph.flush();
};
