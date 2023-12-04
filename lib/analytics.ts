import { AnalyticsClient } from '@codaco/analytics';
import { env } from 'process';
import { api } from '~/trpc/server';

const globalForAnalytics = globalThis as unknown as {
  analytics: AnalyticsClient | undefined;
};
const appSettings = await api.appSettings.get.query();
if (!appSettings || !appSettings.installationId) {
  throw new Error('Could not get app settings');
}

const maxmindAccountId = env.MAXMIND_ACCOUNT_ID;
const maxmindLicenseKey = env.MAXMIND_LICENSE_KEY;
if (!maxmindAccountId || !maxmindLicenseKey) {
  throw new Error('Maxmind environment variables are not defined');
}

export const analytics =
  globalForAnalytics.analytics ??
  new AnalyticsClient({
    installationId: appSettings.installationId,
    maxmindAccountId: maxmindAccountId,
    maxmindLicenseKey: maxmindLicenseKey,
  });

if (env.NODE_ENV !== 'production') globalForAnalytics.analytics = analytics;
