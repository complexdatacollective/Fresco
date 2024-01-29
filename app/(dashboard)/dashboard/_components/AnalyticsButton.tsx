'use client';
import { trackEvent } from '~/analytics/utils';
import { Button } from '~/components/ui/Button';

const AnalyticsButton = () => {
  const sendEvent = () =>
    trackEvent({
      type: 'ProtocolInstalled',
      metadata: {
        protocol: 'ethereum',
        version: '1.0.0',
      },
    });

  return (
    <>
      <Button onClick={() => sendEvent()}>Send test event</Button>
    </>
  );
};

export default AnalyticsButton;
