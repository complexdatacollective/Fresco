'use client';

import { Switch } from '~/components/ui/switch';
import { useOptimistic, useTransition } from 'react';
import { api } from '~/trpc/client';
import { analytics } from '~/lib/analytics';

const AnalyticsSwitch = () => {
  const enabled = analytics.isEnabled;
  const [, startTransition] = useTransition();
  const [optimisticAllowAnalytics, setOptimisticAllowAnalytics] = useOptimistic(
    enabled,
    (state: boolean, newState: boolean) => newState,
  );
  const appSettings = api.appSettings.get.useQuery();
  const enableAnalytics = () => {
    if (!appSettings.data?.installationId) {
      throw new Error('No installationId found');
    }

    analytics.setInstallationId(appSettings?.data?.installationId);
    analytics.enable();
  };

  // eslint-disable-next-line no-process-env
  const globalAnalyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;

  return (
    <div
      className={`mb-4 ${
        globalAnalyticsEnabled === 'false' ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="mr-20">
          <h3 className="font-bold">Allow Analytics</h3>
          <p className="text-sm text-gray-600">
            Information collected includes the number of protocols uploaded,
            interviews conducted, participants recruited, and participants who
            completed the interview. No personally identifiable information,
            interview data, or protocol data is collected.
          </p>
        </div>

        <Switch
          name="allowAnalytics"
          checked={optimisticAllowAnalytics}
          onCheckedChange={(value) => {
            startTransition(() => {
              setOptimisticAllowAnalytics(value);

              try {
                value ? enableAnalytics() : analytics.disable();
              } catch (error) {
                if (error instanceof Error) {
                  throw new Error(error.message);
                }
                throw new Error('Something went wrong');
              }
            });
          }}
          disabled={globalAnalyticsEnabled === 'false'}
        />
      </div>
    </div>
  );
};

export default AnalyticsSwitch;
