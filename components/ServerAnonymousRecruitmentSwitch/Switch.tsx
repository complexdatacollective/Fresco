'use client';

import { Switch as SwitchUI } from '~/components/ui/switch';
import { useOptimistic, useTransition } from 'react';
import { setAnonymousRecruitment } from '~/actions/appSettings';

const Switch = ({
  allowAnonymousRecruitment,
}: {
  allowAnonymousRecruitment: boolean;
}) => {
  const [, startTransition] = useTransition();
  const [optimisticIsActive, setOptimisticIsActive] = useOptimistic(
    allowAnonymousRecruitment,
    (_, newValue: boolean) => newValue,
  );

  const updateIsActive = async (newValue: boolean) => {
    setOptimisticIsActive(newValue);
    await setAnonymousRecruitment(newValue); // this is a server action which calls `revalidateTag`
  };

  return (
    <SwitchUI
      name="allowAnonymousRecruitment"
      checked={optimisticIsActive}
      onCheckedChange={(checked) =>
        startTransition(() => updateIsActive(checked))
      }
    />
  );
};

export default Switch;
