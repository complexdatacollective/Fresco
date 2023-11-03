'use client';

import { Switch as SwitchUI } from '~/components/ui/switch';
import { setAnalytics } from './action';
import { useOptimistic, useTransition } from 'react';

const Switch = ({ allowAnalytics }: { allowAnalytics: boolean }) => {
  const [, startTransition] = useTransition();
  const [optimisticAllowAnalytics, setOptimisticAllowAnalytics] = useOptimistic(
    allowAnalytics,
    (state: boolean, newState: boolean) => newState,
  );

  return (
    <div className="mb-4">
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
              await setAnalytics(value);
            });
          }}
        />
      </div>
    </div>
  );
};

export default Switch;
