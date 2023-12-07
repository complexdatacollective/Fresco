'use client';
import { Button } from '~/components/ui/Button';
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

  return (
    <>
      <Button onClick={() => sendEvent()}>
        Send protocol installed event to analytics
      </Button>
    </>
  );
};

export default AnalyticsButton;
