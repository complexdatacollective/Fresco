'use client';
import { Button } from '~/components/ui/Button';
import { Switch } from '~/components/ui/switch';
import { analytics } from '~/lib/analytics';

const AnalyticsButton = () => {
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
    analytics.setInstallationId('123');
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
