'use client';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/Toast';
import trackEvent from '~/lib/analytics';
import { ensureError } from '~/utils/ensureError';

const AnalyticsButton = () => {
  const { add } = useToast();
  const sendEvent = () =>
    trackEvent({
      type: 'ProtocolInstalled',
      metadata: {
        protocol: 'ethereum',
        version: '1.0.0',
      },
    })
      .then(() => {
        add({
          title: 'Success',
          description: 'Test event sent',
          type: 'success',
        });
      })
      .catch((e) => {
        const error = ensureError(e);
        // eslint-disable-next-line no-console
        console.log(error);
        add({
          title: 'Error',
          description: 'Sending event failed',
          type: 'destructive',
        });
      });

  return (
    <>
      <Button onClick={() => sendEvent()}>Send test event</Button>
    </>
  );
};

export default AnalyticsButton;
