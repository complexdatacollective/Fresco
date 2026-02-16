import posthog from 'posthog-js';
import { POSTHOG_API_KEY, POSTHOG_PROXY_HOST } from './fresco.config';

posthog.init(POSTHOG_API_KEY, {
  api_host: POSTHOG_PROXY_HOST,
  defaults: '2026-01-30',
});
