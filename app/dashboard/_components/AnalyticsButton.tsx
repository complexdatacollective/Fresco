'use client';
import { trackEvent } from '~/lib/analytics';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/use-toast';
import { ensureError } from '~/utils/ensureError';

const AnalyticsButton = () => {
  const { toast } = useToast();
  const sendEvent = () =>
    trackEvent({
      type: 'ProtocolInstalled',
      metadata: {
        protocol: 'ethereum',
        version: '1.0.0',
      },
    })
      .then(() => {
        toast({
          title: 'Success',
          description: 'Test event sent',
          variant: 'success',
        });
      })
      .catch((e) => {
        const error = ensureError(e);
        // eslint-disable-next-line no-console
        console.log(error);
        toast({
          title: 'Error',
          description: 'Sending event failed',
          variant: 'destructive',
        });
      });

  return (
    <>
      <Button onClick={() => sendEvent()}>Send test event</Button>
    </>
  );
};

export default AnalyticsButton;
