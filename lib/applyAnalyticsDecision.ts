import { type AnalyticsDecision } from '~/lib/analyticsDecision';
import { startPostHog, stopPostHog } from '~/lib/posthog-client';

/**
 * Acts on the server's decision about analytics, once per distinct answer.
 *
 * Two things call this, for two different requirements:
 *
 * - `instrumentation-client.ts`, from the `<meta>` tag, before hydration and
 *   outside the React tree. This is the one that has to work when the root
 *   layout fails to hydrate, because the error boundary that renders in its
 *   place would otherwise queue a crash report nothing would ever send.
 * - `ApplyAnalyticsDecision`, on every render. This is the one that notices a
 *   researcher turning analytics off in a tab that is already open: the
 *   setting change re-renders the layout with a new answer, and the tab has to
 *   stop capturing rather than wait for a full page load.
 *
 * Both routinely see the same answer, so repeats are ignored — starting
 * analytics again would identify the browser and repeat the opt-in event.
 * A genuinely different answer is always acted on.
 */
let lastApplied: string | undefined;

export function applyAnalyticsDecision(decision: AnalyticsDecision) {
  const answer = JSON.stringify(decision);

  if (answer === lastApplied) {
    return;
  }
  lastApplied = answer;

  if (decision.enabled) {
    void startPostHog(decision.installationId);
    return;
  }

  void stopPostHog();
}
