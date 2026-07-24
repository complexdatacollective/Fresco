import { POSTHOG_API_KEY, POSTHOG_PROXY_HOST } from './fresco.config';

// Defer PostHog to a separate chunk loaded after the page is interactive.
// The dynamic import creates a code-split point so posthog-js doesn't
// block the initial bundle.
void import('posthog-js').then(({ default: posthog }) => {
  posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_PROXY_HOST,
    defaults: '2026-01-30',
    capture_exceptions: true,
    autocapture: true,
  });
});
