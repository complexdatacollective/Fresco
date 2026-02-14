import { logs } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs';
import type { Instrumentation } from 'next';
import { APP_NAME, POSTHOG_HOST, POSTHOG_KEY } from './fresco.config';

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
  // eslint-disable-next-line no-process-env
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { handleRequestError } =
    await import('./lib/analytics/handleRequestError');
  await handleRequestError(err, request, context);
};
