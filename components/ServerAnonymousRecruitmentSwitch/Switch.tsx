'use client';

import { Switch as SwitchUI } from '~/components/ui/switch';
import { useOptimistic, useTransition } from 'react';
import { setAnonymousRecruitment } from './utils';

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
  );
};

export default Switch;
