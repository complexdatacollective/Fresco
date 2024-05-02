import { makeEventTracker } from '@codaco/analytics';
import { env } from '~/env.mjs';

export const trackEvent = makeEventTracker({
  enabled: true,
});
