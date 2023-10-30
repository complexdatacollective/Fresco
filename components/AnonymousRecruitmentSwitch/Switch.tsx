'use client';

import { Switch as SwitchUI } from '~/components/ui/switch';
import { setAnonymousRecruitment } from './action';
import { useOptimistic, useTransition } from 'react';

const Switch = ({
  allowAnonymousRecruitment,
}: {
  allowAnonymousRecruitment: boolean;
}) => {
  const [, startTransition] = useTransition();
  const [
    optimisticAllowAnonymousRecruitment,
    setOptimisticAllowAnonymousRecruitment,
  ] = useOptimistic(
    allowAnonymousRecruitment,
    (state: boolean, newState: boolean) => newState,
  );

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Anonymous Recruitment</h3>
          <p className="text-sm text-gray-600">
            Allow anonymous recruitment of participants.
          </p>
        </div>
        <SwitchUI
          name="allowAnonymousRecruitment"
          checked={optimisticAllowAnonymousRecruitment}
          onCheckedChange={(value) => {
            startTransition(async () => {
              setOptimisticAllowAnonymousRecruitment(value);
              await setAnonymousRecruitment(value);
            });
          }}
        />
      </div>
    </div>
  );
};

export default Switch;
