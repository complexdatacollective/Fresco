import { usePlausible } from 'next-plausible';

export function useAnalytics() {
  const plausible = usePlausible();

  const trackEvent = (eventName: string, installationId?: string) => {
    installationId
      ? plausible(eventName, { props: { installationId } })
      : plausible(eventName);
  };

  return trackEvent;
}
