import { connection } from 'next/server';

import ApplyAnalyticsDecision from '~/components/Providers/ApplyAnalyticsDecision';
import {
  ANALYTICS_DECISION_META_NAME,
  type AnalyticsDecision,
} from '~/lib/analyticsDecision';
import { getDisableAnalytics, getInstallationId } from '~/queries/appSettings';

/**
 * Decides on the server whether this deployment runs analytics, and publishes
 * the answer for the browser to read.
 *
 * The decision has to happen here rather than in the browser: PostHog contacts
 * the relay the moment it initialises, so a deployment that set
 * `DISABLE_ANALYTICS` must never get as far as loading it.
 *
 * The answer is published as a `<meta>` tag rather than acted on by a
 * component, so that it survives the root layout failing to hydrate — see
 * `~/lib/analyticsDecision`. `instrumentation-client.ts` is what reads it.
 */
async function resolveDecision(): Promise<AnalyticsDecision> {
  try {
    if (await getDisableAnalytics()) {
      return { enabled: false };
    }

    return { enabled: true, installationId: await getInstallationId() };
  } catch {
    // The settings couldn't be read, so we don't know whether this deployment
    // consented to analytics. Stay silent rather than assume consent.
    return { enabled: false };
  }
}

export default async function AnalyticsLoader() {
  // Opt this subtree out of prerendering — getDisableAnalytics and
  // getInstallationId can fall back to the database, which isn't available at
  // build time (e.g. when building the distributable Docker image). The
  // <Suspense> boundary in RootLayout lets Next stream this in at request time
  // instead.
  await connection();

  const decision = await resolveDecision();

  return (
    <>
      {/* Read by instrumentation-client.ts, which does not need React. */}
      <meta
        name={ANALYTICS_DECISION_META_NAME}
        content={JSON.stringify(decision)}
      />
      {/* Follows the decision when a researcher changes the setting in a tab
          that is already open, which the tag alone cannot do. */}
      <ApplyAnalyticsDecision decision={decision} />
    </>
  );
}
