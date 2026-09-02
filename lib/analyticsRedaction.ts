/**
 * Keeps participant access links out of analytics.
 *
 * A participant reaches their interview through `/interview/<interviewId>`,
 * and that identifier is the whole of their authentication: knowing it is
 * enough to read and overwrite the interview through the sync route. The
 * onboarding link, `/onboard/<protocolId>`, additionally carries a
 * researcher-assigned `participantIdentifier` in its query string, which names
 * a human being.
 *
 * `next.config.ts` already sends `strict-origin-when-cross-origin` from both
 * routes, so a third-party sub-resource sees the origin and never the path
 * those values live in. Analytics is the other way out:
 * posthog-js attaches the current URL to every event it captures, so an
 * enabled deployment would send participant access links to PostHog on every
 * autocaptured click. This module is what stops that.
 */

/** The identifier segment of a participant route, wherever it appears. */
const PARTICIPANT_ROUTE_ID = /(\/(?:interview|onboard)\/)([^/?#\s"']+)/gi;

/** A participant route, used to decide whether a query string may be kept. */
const PARTICIPANT_ROUTE = /\/(?:interview|onboard)(?:[/?#]|$)/i;

const REDACTED = '[redacted]';

/**
 * Segments under a participant route that are page names rather than
 * identifiers, and are worth keeping so a report says which page was involved.
 *
 * Anything absent from this list is redacted, so a route added later is
 * reported as `[redacted]` until it is listed here. That is the safe direction
 * to be wrong in: a missing label is a nuisance, a leaked identifier is not.
 */
const NAMED_PARTICIPANT_SEGMENTS = new Set([
  'finished',
  'error',
  'invalid-link',
  'no-anonymous-recruitment',
]);

/**
 * Replaces participant identifiers in a URL or path, and drops the query
 * string of a participant route entirely.
 */
export function redactParticipantLinks(value: string): string {
  const withoutIds = value.replace(
    PARTICIPANT_ROUTE_ID,
    (match: string, route: string, segment: string) =>
      NAMED_PARTICIPANT_SEGMENTS.has(segment.toLowerCase())
        ? match
        : `${route}${REDACTED}`,
  );

  if (!PARTICIPANT_ROUTE.test(withoutIds)) {
    return withoutIds;
  }

  // `participantIdentifier` is the one that matters, but a participant route's
  // query string has no analytics value worth the risk of enumerating what
  // else might end up in it.
  return withoutIds.replace(/[?#][\s\S]*$/, '');
}

/**
 * How deep to walk an event's properties. Autocapture nests the clicked
 * element's attributes — `attr__href` among them — a few levels down.
 */
const MAX_DEPTH = 5;

/**
 * Session replay payloads, which are large and are not scrubbed here.
 * Participant pages are never recorded in the first place; see
 * `startPostHog`.
 */
const UNWALKED_PROPERTIES = new Set(['$snapshot_data']);

function redactValue(value: unknown, depth: number): unknown {
  if (typeof value === 'string') {
    return redactParticipantLinks(value);
  }

  if (depth >= MAX_DEPTH || value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    const entries: unknown[] = value;
    return entries.map((entry) => redactValue(entry, depth + 1));
  }

  // Only property bags are walked. Rebuilding anything else from its own
  // entries would throw the value away — `Object.entries(new Date())` is
  // empty, so a Date would be reported as `{}`.
  if (!isPlainObject(value)) {
    return value;
  }

  return redactObject(value, depth + 1);
}

function isPlainObject(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function redactObject(value: object, depth: number): Record<string, unknown> {
  const entries: [string, unknown][] = Object.entries(value);
  const redacted: Record<string, unknown> = {};

  for (const [key, entry] of entries) {
    redacted[key] = UNWALKED_PROPERTIES.has(key)
      ? entry
      : redactValue(entry, depth);
  }

  return redacted;
}

/**
 * Returns a copy of an event's properties with every participant link in them
 * redacted, however deeply nested.
 */
export function redactProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  return redactObject(properties, 0);
}

/**
 * Whether a path is one a participant sees.
 *
 * Used to keep session replay off those pages: replay records the page's own
 * URL inside its payload, where redacting properties cannot reach it, and a
 * recording of someone answering interview questions is research data rather
 * than telemetry.
 */
export function isParticipantPath(pathname: string): boolean {
  return /^\/(?:interview|onboard)(?:\/|$)/i.test(pathname);
}
