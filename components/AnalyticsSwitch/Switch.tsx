'use client';

import { Switch as SwitchUI } from '~/components/ui/switch';
import { setAnalytics } from './action';
import { useOptimistic, useTransition } from 'react';
import { api } from '~/trpc/client';
import { analytics } from '~/lib/analytics';

const Switch = ({ allowAnalytics }: { allowAnalytics: boolean }) => {
  const [, startTransition] = useTransition();
  const [optimisticAllowAnalytics, setOptimisticAllowAnalytics] = useOptimistic(
    allowAnalytics,
    (state: boolean, newState: boolean) => newState,
  );
  const utils = api.useUtils();

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
        <SwitchUI
          name="allowAnalytics"
          checked={optimisticAllowAnalytics}
          onCheckedChange={(value) => {
            startTransition(async () => {
              setOptimisticAllowAnalytics(value);

              try {
                await setAnalytics(value);
                await utils.appSettings.get.refetch();
                if (value === true) {
                  analytics.enable();
                } else {
                  analytics.disable();
                }
              } catch (error) {
                if (error instanceof Error) {
                  throw new Error(error.message, { cause: error });
                }
                throw new Error('Something went wrong', { cause: 400 });
              }
            });
          }}
          disabled={globalAnalyticsEnabled === 'false'}
        />
      </div>
    </div>
  );
};

export default Switch;