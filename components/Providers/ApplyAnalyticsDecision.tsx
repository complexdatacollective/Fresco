'use client';

import { useEffect } from 'react';

import { type AnalyticsDecision } from '~/lib/analyticsDecision';
import { applyAnalyticsDecision } from '~/lib/applyAnalyticsDecision';

/**
 * Follows the server's decision for as long as this tab is open.
 *
 * `instrumentation-client.ts` acts on the decision published with the page,
 * and does so without needing React — which is what makes a crash during
 * hydration reportable. It reads the answer once, though, so it cannot notice
 * a researcher turning analytics off while the dashboard is open: that
 * invalidates the setting and re-renders this component with a new answer,
 * and the tab has to stop capturing there and then rather than at the next
 * full page load.
 *
 * Seeing the same answer twice is the normal case and does nothing; see
 * `applyAnalyticsDecision`.
 */
export default function ApplyAnalyticsDecision({
  decision,
}: {
  decision: AnalyticsDecision;
}) {
  const { enabled, installationId } = decision;

  useEffect(() => {
    applyAnalyticsDecision({ enabled, installationId });
  }, [enabled, installationId]);

  return null;
}
