'use client';

import { Switch as SwitchUI } from '~/components/ui/switch';
import { useOptimistic, useTransition } from 'react';
import { setLimitInterviews } from './utils';

const Switch = ({ limitInterviews }: { limitInterviews: boolean }) => {
  const [, startTransition] = useTransition();
  const [optimisticLimitInterviews, setOptimisticLimitInterviews] =
    useOptimistic(
      limitInterviews,
      (state: boolean, newState: boolean) => newState,
    );

  return (
    <SwitchUI
      name="limitInterviews"
      checked={optimisticLimitInterviews}
      onCheckedChange={(value) => {
        startTransition(async () => {
          setOptimisticLimitInterviews(value);
          await setLimitInterviews(value);
        });
      }}
    />
  );
};

export default Switch;
