// lib/posthog-server.ts
import { type EventMessage, PostHog } from 'posthog-node';

import {
  POSTHOG_API_KEY,
  POSTHOG_APP_PROPERTIES,
  POSTHOG_PROXY_HOST,
} from '~/fresco.config';

let client: PostHog | null = null;

export const POSTHOG_SESSION_ID_HEADER = 'x-posthog-session-id';

const TRACING_HEADER_MAX_LENGTH = 1000;
// Remove C0 controls, DEL, and C1 controls from tracing IDs received from the
// browser before adding them to server-side events.
// eslint-disable-next-line no-control-regex
const TRACING_HEADER_CONTROL_CHARS_REGEX = /[\x00-\x1f\x7f-\x9f]/g;

export function getPostHogSessionProperties(
  value: string | string[] | null | undefined,
): { $session_id?: string } {
  const values = Array.isArray(value) ? value : [value];

  for (const candidate of values) {
    if (typeof candidate !== 'string') continue;

    const sessionId = candidate
      .replace(TRACING_HEADER_CONTROL_CHARS_REGEX, '')
      .trim()
      .slice(0, TRACING_HEADER_MAX_LENGTH);

    if (sessionId) return { $session_id: sessionId };
  }

  return {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// posthog-node's public `captureException` hard-codes its own hint, and the
// third argument is merged as ordinary event properties. There is therefore no
// parameter for the mechanism error tracking shows against an exception, and
// without one every report is recorded as `generic` and `handled: true` — so a
// genuinely unhandled failure would arrive looking like a handled one. Reports
// from the process listeners carry this marker instead, and `before_send` —
// the supported hook for editing an event on its way out — moves it into the
// exception itself. The type strings match the ones posthog-node's own
// autocapture used, so these reports line up with anything captured before.
const MECHANISM_PROPERTY = 'fresco_exception_mechanism';

export type ExceptionMechanism = 'onuncaughtexception' | 'onunhandledrejection';

function moveMechanismIntoException(
  event: EventMessage | null,
): EventMessage | null {
  if (!event?.properties) return event;

  const mechanism = event.properties[MECHANISM_PROPERTY];
  if (typeof mechanism !== 'string') return event;

  const properties = { ...event.properties };
  delete properties[MECHANISM_PROPERTY];

  const exceptions: unknown = properties.$exception_list;
  if (Array.isArray(exceptions)) {
    properties.$exception_list = exceptions.map((exception: unknown, index) => {
      if (!isRecord(exception)) return exception;

      // Only the first entry is the failure itself. `ErrorPropertiesBuilder`
      // walks an error's `cause` chain into further entries and deliberately
      // marks those handled, and gives every entry its own `synthetic` flag —
      // both of which autocapture kept, so both are kept here. Overwriting the
      // whole mechanism would report one cause chain as several unhandled
      // failures and lose `synthetic` along the way.
      const generated = isRecord(exception.mechanism)
        ? exception.mechanism
        : {};

      return {
        ...exception,
        mechanism: { ...generated, type: mechanism, handled: index !== 0 },
      };
    });
  }

  return { ...event, properties };
}

/**
 * Returns the shared server-side client, constructing it on first use.
 *
 * Nothing may reach the client without first checking whether this deployment
 * has analytics enabled, and that check has to happen on every capture rather
 * than once at construction: a researcher can turn analytics off at any point,
 * and the server keeps running.
 *
 * That rule is why `enableExceptionAutocapture` is deliberately absent.
 * Enabling it makes posthog-node add `uncaughtException` and
 * `unhandledRejection` listeners to the process, and those listeners report
 * straight to the relay without consulting the setting. They are installed
 * when the client is constructed and there is no way to take them back:
 * `shutdown()` stops the exception rate limiter and leaves the listeners in
 * place, so rebuilding the client would add a second pair rather than replace
 * the first. A deployment that started with analytics enabled would therefore
 * keep sending exceptions for the life of the process after being told not to.
 *
 * Nothing is given up by leaving it off. Errors raised while handling a
 * request reach `onRequestError`, which checks the setting; errors thrown in
 * `after` callbacks are caught and logged by Next, and never reached these
 * listeners anyway. Failures outside any request are reported by
 * `installProcessErrorReporting` below, which does consult the setting, on
 * every event.
 */
export function getPostHogServer() {
  client ??= new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_PROXY_HOST,
    flushAt: 1,
    flushInterval: 0,
    before_send: moveMechanismIntoException,
  });
  return client;
}

/**
 * Reads the analytics setting without the cached helpers in
 * `queries/appSettings`.
 *
 * Those use `use cache` + `cacheLife()`, which are unavailable both in the
 * instrumentation context and in a process-level error handler, which can run
 * at any moment rather than inside a request.
 *
 * The environment variable only forces analytics off, mirroring
 * `getDisableAnalytics` — an unset or false value defers to the database.
 */
export async function isAnalyticsDisabledUncached() {
  const { env } = await import('~/env');
  if (env.DISABLE_ANALYTICS) return true;

  try {
    const { prisma } = await import('~/lib/db');
    const setting = await prisma.appSettings.findUnique({
      where: { key: 'disableAnalytics' },
    });
    return setting?.value === 'true';
  } catch {
    // Without the setting we can't tell whether this deployment consented
    // to analytics, so stay silent rather than assume consent.
    return true;
  }
}

/** The installation ID, read the same way and for the same reason. */
export async function resolveInstallationIdUncached() {
  const { env } = await import('~/env');
  if (env.INSTALLATION_ID) return env.INSTALLATION_ID;

  try {
    const { prisma } = await import('~/lib/db');
    const result = await prisma.appSettings.findUnique({
      where: { key: 'installationId' },
    });
    return result?.value ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

// A process-level failure can repeat without limit — one broken interval can
// reject forever — and each report costs a settings read as well as a request
// to the relay. posthog-node's autocapture carried a rate limiter; this
// replaces it, with the same shape: a token bucket per kind of failure rather
// than one for the whole process, so a noisy repeat cannot use up the capacity
// a new and different failure needs. Ten tokens, one back every ten seconds,
// matching the SDK's defaults. Next logs every occurrence either way, so a
// dropped report costs nothing an operator cannot see in the server log.
const REPORT_BUCKET_SIZE = 10;
const REPORT_REFILL_MS = 10_000;
// Bounded, unlike the SDK's, because the key includes the error's name: code
// that throws many differently-named errors would otherwise grow this without
// limit. Least recently used goes first, and a dropped key simply starts from
// a full bucket next time.
const MAX_TRACKED_FAILURE_KINDS = 50;

type ReportBucket = { tokens: number; refilledAt: number };
const reportBuckets = new Map<string, ReportBucket>();

// The value handed to an `unhandledRejection` listener is whatever was
// rejected, which need not cooperate: `instanceof` throws on a revoked proxy,
// and an error can carry a `name` accessor that throws or returns something
// that is not a string. Sliced, too, so a long name cannot bloat a bucket key.
const MAX_FAILURE_NAME_LENGTH = 80;

function failureKind(error: unknown, mechanism: ExceptionMechanism) {
  try {
    const name = error instanceof Error ? error.name : undefined;
    return typeof name === 'string' && name
      ? `${mechanism}:${name.slice(0, MAX_FAILURE_NAME_LENGTH)}`
      : `${mechanism}:${typeof error}`;
  } catch {
    return `${mechanism}:unknown`;
  }
}

function withinReportBudget(kind: string) {
  const now = Date.now();
  const bucket = reportBuckets.get(kind);

  // Re-inserting keeps the map in least-recently-used order, so eviction drops
  // a kind that has gone quiet rather than one that is currently being limited.
  reportBuckets.delete(kind);

  if (!bucket) {
    if (reportBuckets.size >= MAX_TRACKED_FAILURE_KINDS) {
      const leastRecentlyUsed = reportBuckets.keys().next();
      if (!leastRecentlyUsed.done)
        reportBuckets.delete(leastRecentlyUsed.value);
    }
    reportBuckets.set(kind, {
      tokens: REPORT_BUCKET_SIZE - 1,
      refilledAt: now,
    });
    return true;
  }

  const intervals = Math.floor((now - bucket.refilledAt) / REPORT_REFILL_MS);
  if (intervals > 0) {
    bucket.tokens = Math.min(bucket.tokens + intervals, REPORT_BUCKET_SIZE);
    bucket.refilledAt += intervals * REPORT_REFILL_MS;
  }

  reportBuckets.set(kind, bucket);

  if (bucket.tokens === 0) return false;

  bucket.tokens -= 1;
  return true;
}

async function captureProcessError(
  error: unknown,
  mechanism: ExceptionMechanism,
) {
  // Telemetry must never throw, least of all here: an error escaping this
  // handler would re-enter the very listener that is reporting.
  try {
    if (await isAnalyticsDisabledUncached()) return;

    const distinctId = await resolveInstallationIdUncached();
    const posthog = getPostHogServer();

    posthog.captureException(error, distinctId, {
      ...POSTHOG_APP_PROPERTIES,
      installation_id: distinctId,
      $source: 'server',
      [MECHANISM_PROPERTY]: mechanism,
    });

    await flushPostHog();
  } catch {
    // swallow
  }
}

function reportProcessFailure(error: unknown, mechanism: ExceptionMechanism) {
  // Nothing may escape a process-level listener. A throw from the
  // `uncaughtException` one is fatal, and from the `unhandledRejection` one it
  // is re-raised as an uncaught exception, losing the report it was making.
  try {
    if (!withinReportBudget(failureKind(error, mechanism))) return;
    void captureProcessError(error, mechanism);
  } catch {
    // swallow
  }
}

let processErrorReportingInstalled = false;

/**
 * Reports failures that happen outside any request — a rejected promise nobody
 * awaited, a callback that throws on a timer.
 *
 * Next reports errors raised while handling a request through
 * `onRequestError`, and catches and logs the ones thrown in `after` callbacks,
 * so neither reaches a process listener. What is left is genuinely
 * out-of-request work, which nothing else reports. posthog-node offers
 * `enableExceptionAutocapture` for this, but its listeners capture without
 * consulting the deployment's analytics setting and cannot be removed once
 * installed — see `getPostHogServer`. PostHog does not offer a Next-specific
 * alternative, and their own guidance is that autocapture cannot be relied on
 * under Next.
 *
 * These listeners consult the setting on every event instead of caching it, so
 * they are correct whether analytics are on or off and need no teardown when a
 * researcher changes the setting mid-run.
 *
 * Adding them does not change when the process exits. Next installs its own
 * `uncaughtException` and `unhandledRejection` listeners precisely so that an
 * unhandled error does not end the process, and it keeps logging every one of
 * them regardless of what happens here.
 */
export function installProcessErrorReporting() {
  if (processErrorReportingInstalled) return;
  processErrorReportingInstalled = true;

  process.on('uncaughtException', (error) => {
    reportProcessFailure(error, 'onuncaughtexception');
  });

  process.on('unhandledRejection', (reason) => {
    reportProcessFailure(reason, 'onunhandledrejection');
  });
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

async function resolveBrowserSessionProperties() {
  try {
    const { headers } = await import('next/headers');
    const requestHeaders = await headers();
    return getPostHogSessionProperties(
      requestHeaders.get(POSTHOG_SESSION_ID_HEADER),
    );
  } catch {
    // Captures outside a request context have no browser session to correlate.
    return {};
  }
}

export async function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  // Telemetry must never throw — DB lookups for installationId/disableAnalytics
  // can fail, and a failed capture should never break the calling flow.
  try {
    if (await isAnalyticsDisabled()) return;

    const distinctId = await resolveInstallationId();
    const browserSessionProperties = await resolveBrowserSessionProperties();
    const posthog = getPostHogServer();

    posthog.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        ...browserSessionProperties,
        ...POSTHOG_APP_PROPERTIES,
        installation_id: distinctId,
        $source: 'server',
      },
    });
  } catch {
    // swallow
  }
}

export async function captureException(
  error: unknown,
  properties?: Record<string, unknown>,
) {
  // Telemetry must never throw — DB lookups for installationId/disableAnalytics
  // can fail, and a failed capture should never replace the original error.
  try {
    if (await isAnalyticsDisabled()) return;

    const distinctId = await resolveInstallationId();
    const browserSessionProperties = await resolveBrowserSessionProperties();
    const posthog = getPostHogServer();

    posthog.captureException(error, distinctId, {
      ...properties,
      ...browserSessionProperties,
      ...POSTHOG_APP_PROPERTIES,
      installation_id: distinctId,
      $source: 'server',
    });
  } catch {
    // swallow
  }
}

/**
 * Flushes anything captured so far, so it is delivered before a serverless
 * invocation freezes.
 *
 * This flushes rather than shuts the client down. One request can queue
 * several `after` callbacks — a route's own telemetry alongside activity
 * recorded by the action it called — and Next runs them concurrently against
 * this one shared client. Tearing the client down would let whichever callback
 * finished first strand another's event: the second would find `client` already
 * null, skip its own flush, and return with the event unsent. Flushing is
 * idempotent and safe to call concurrently, and the client is meant to outlive
 * a single request anyway — that is what memoizing it above is for.
 */
export async function flushPostHog() {
  // Telemetry must never throw: this runs inside `after` callbacks, where an
  // error would surface as an unhandled rejection long after the response.
  try {
    await client?.flush();
  } catch {
    // swallow
  }
}
