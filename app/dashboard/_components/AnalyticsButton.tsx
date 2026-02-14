'use client';
import posthog from 'posthog-js';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/Toast';

const AnalyticsButton = () => {
  const { add } = useToast();
  const sendEvent = () => {
    posthog.capture('ProtocolInstalled', {
      protocol: 'ethereum',
      version: '1.0.0',
    });
    add({
      title: 'Success',
      description: 'Test event sent',
      type: 'success',
    });
  };

  return <Button onClick={sendEvent}>Send test event</Button>;
};

export default AnalyticsButton;
