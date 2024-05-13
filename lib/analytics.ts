import { makeEventTracker } from '@codaco/analytics';
import { env } from '~/env.mjs';

export const trackEvent = makeEventTracker({
  enabled: !env.NEXT_PUBLIC_DISABLE_ANALYTICS,
});
