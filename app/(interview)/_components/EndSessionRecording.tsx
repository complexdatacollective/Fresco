'use client';

import { useEffect } from 'react';

import { stopSessionRecording } from '~/lib/posthog-client';

/**
 * Ends session replay for any page a participant sees.
 *
 * Replay writes the page's own URL into its payload, where the redaction in
 * `~/lib/analyticsRedaction` cannot reach it — and on these routes that URL is
 * the participant's access credential. A recording of someone answering
 * interview questions is also research data rather than telemetry, and is not
 * something a deployment's analytics setting was ever meant to consent to.
 *
 * posthog-js is told not to record when it initialises on one of these paths,
 * which covers a participant arriving through their link. This covers the
 * other way in: a researcher opening an interview from the dashboard, where
 * recording is already running and client-side navigation means posthog-js
 * never re-initialises.
 */
export default function EndSessionRecording() {
  useEffect(() => {
    void stopSessionRecording();
  }, []);

  return null;
}
