import posthog from 'posthog-js';
import { POSTHOG_HOST, POSTHOG_KEY } from './fresco.config';

posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  ui_host: 'https://us.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: true,
});
