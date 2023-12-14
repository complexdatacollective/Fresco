'use client';
import { trackEvent } from '~/analytics/utils';
import { Button } from '~/components/ui/Button';

const AnalyticsButton = () => {
  const sendEvent = async () =>
    await trackEvent({
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
