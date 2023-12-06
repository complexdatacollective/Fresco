'use client';
import { Button } from '~/components/ui/Button';
import { analytics } from '~/lib/analytics';
import { api } from '~/trpc/client';

const AnalyticsButton = () => {
  const appSettings = api.appSettings.get.useQuery();
  const sendEvent = () =>
    analytics.trackEvent({
      type: 'ProtocolInstalled',
      metadata: {
        protocol: 'ethereum',
        version: '1.0.0',
      },
    });

  const isAnalyticsEnabled = () => analytics.isEnabled;

  const enableAnalytics = () => {
    if (!appSettings.data?.installationId) {
      throw new Error('No installationId found');
    }

    analytics.setInstallationId(appSettings?.data?.installationId);
    analytics.enable();
  };

  return (
    <>
      <p>Analytics enabled: {isAnalyticsEnabled().toString()}</p>
      <Button onClick={() => enableAnalytics()}>Enable analytics</Button>
      <Button onClick={() => sendEvent()}>
        Send protocol installed event to analytics
      </Button>
    </>
  );
};

export default AnalyticsButton;
