import { AnalyticsClient } from '@codaco/analytics';
import { env } from '~/env.mjs';

const globalForAnalytics = globalThis as unknown as {
  analytics: AnalyticsClient | undefined;
};

export const analytics =
  globalForAnalytics.analytics ??
  new AnalyticsClient({
    platformUrl:
      'https://error-analytics-microservice-git-06aae6-network-canvas-f4790d84.vercel.app',
  });

if (env.NODE_ENV !== 'production') globalForAnalytics.analytics = analytics;
