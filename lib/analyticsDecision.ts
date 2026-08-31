/**
 * How the server tells the browser whether this deployment runs analytics.
 *
 * The decision needs a database read, so it can only be made on the server, and
 * it has to reach the browser without depending on React having hydrated —
 * that is the whole point. When the root layout fails to hydrate, React
 * replaces the tree with `app/global-error.tsx` and every component in the
 * layout goes with it, including anything that might have started analytics.
 * An error boundary in that position would otherwise hold a report it has no
 * way to send.
 *
 * So the answer travels as a `<meta>` tag rendered by `AnalyticsLoader`, and is
 * picked up by `instrumentation-client.ts`, which Next runs before hydration
 * and independently of the React tree. A meta tag rather than an inline script
 * because `AnalyticsLoader` streams in from inside a `<Suspense>` boundary:
 * React reveals that content by moving already-parsed nodes into place, and a
 * script element that has already been parsed does not execute when it is
 * moved. Reading an attribute has no such problem.
 */

export const ANALYTICS_DECISION_META_NAME = 'fresco-analytics';

export type AnalyticsDecision = {
  enabled: boolean;
  installationId?: string;
};

/**
 * Reads a decision out of its serialised form, or returns undefined if it is
 * not one. Undefined means "no answer yet", which keeps analytics off.
 */
export function parseAnalyticsDecision(
  value: unknown,
): AnalyticsDecision | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const candidate: Record<string, unknown> = { ...value };

  if (typeof candidate.enabled !== 'boolean') {
    return undefined;
  }

  const installationId =
    typeof candidate.installationId === 'string'
      ? candidate.installationId
      : undefined;

  return { enabled: candidate.enabled, installationId };
}
