'use client';

import { useOptimistic, useTransition } from 'react';
import { Switch as SwitchUI } from '~/components/ui/switch';

const SwitchWithOptimisticUpdate = ({
  initialValue,
  name,
  action,
}: {
  initialValue: boolean;
  name: string;
  action: (key: string, value: boolean) => Promise<void>;
}) => {
  const [isTransitioning, startTransition] = useTransition();
  const [optimisticIsActive, setOptimisticIsActive] = useOptimistic(
    initialValue,
    (_, newValue: boolean) => newValue,
  );

  const updateIsActive = async (newValue: boolean) => {
    setOptimisticIsActive(newValue);
    await action(name, newValue); // this is a server action which calls `revalidateTag`
  };

  return (
    <SwitchUI
      name={name}
      checked={optimisticIsActive}
      onCheckedChange={(checked) =>
        startTransition(() => updateIsActive(checked))
      }
      disabled={isTransitioning}
    />
  );
};

export default SwitchWithOptimisticUpdate;
