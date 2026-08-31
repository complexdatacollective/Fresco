import {
  ANALYTICS_DECISION_META_NAME,
  type AnalyticsDecision,
  parseAnalyticsDecision,
} from '~/lib/analyticsDecision';
import { applyAnalyticsDecision } from '~/lib/applyAnalyticsDecision';

/**
 * Acts on the server's decision about analytics, as early in a page load as
 * Next allows and without waiting for React.
 *
 * This file runs before hydration and outside the React tree, which is what
 * makes it the right home for this. The decision used to be applied by an
 * effect in a component inside the root layout — so when the root layout
 * failed to hydrate, React replaced that component along with everything else
 * and analytics were never started. The error boundary that renders in its
 * place would queue a crash report that nothing would ever send. Applying the
 * decision here means the queue drains whatever React does.
 *
 * It deliberately does not initialise PostHog itself. PostHog is only started
 * for a deployment that has said yes, and posthog-js is imported dynamically
 * at that point, so a deployment with analytics disabled never fetches the
 * library and never contacts the relay.
 *
 * Reading the tag once is enough here: `ApplyAnalyticsDecision` follows any
 * later change to the setting, and both go through `applyAnalyticsDecision`,
 * which ignores an answer it has already acted on.
 */

function readDecision(): AnalyticsDecision | undefined {
  const content = document
    .querySelector(`meta[name="${ANALYTICS_DECISION_META_NAME}"]`)
    ?.getAttribute('content');

  if (!content) {
    return undefined;
  }

  try {
    return parseAnalyticsDecision(JSON.parse(content));
  } catch {
    return undefined;
  }
}

/**
 * Watches for the decision to stream in.
 *
 * `AnalyticsLoader` renders from inside a `<Suspense>` boundary, because the
 * settings it reads are not available when the Docker image is built. The tag
 * therefore usually arrives after this file runs, and always before the page
 * finishes loading.
 */
function waitForDecision() {
  const observer = new MutationObserver(() => {
    const decision = readDecision();
    if (!decision) {
      return;
    }

    observer.disconnect();
    applyAnalyticsDecision(decision);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // A page that finished loading without the tag has no answer coming — the
  // settings could not be read. Stop watching rather than leave an observer
  // running over the whole document for the life of the tab.
  window.addEventListener(
    'load',
    () => {
      const decision = readDecision();
      observer.disconnect();

      if (decision) {
        applyAnalyticsDecision(decision);
      }
    },
    { once: true },
  );
}

const decision = readDecision();

if (decision) {
  applyAnalyticsDecision(decision);
} else {
  waitForDecision();
}
