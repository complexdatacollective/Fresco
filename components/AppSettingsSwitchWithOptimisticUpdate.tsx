'use client';

import { useOptimistic, useTransition } from 'react';
import { type z } from 'zod';
import { setAppSetting } from '~/actions/appSettings';
import { Switch as SwitchUI } from '~/components/ui/switch';
import { type appSettingSchema } from '~/schemas/appSettings';

const SwitchWithOptimisticUpdate = ({
  initialValue,
  name,
  appSettingKey,
}: {
  initialValue: boolean;
  name: string;
  appSettingKey: keyof z.infer<typeof appSettingSchema>;
}) => {
  const [isTransitioning, startTransition] = useTransition();
  const [optimisticIsActive, setOptimisticIsActive] = useOptimistic(
    initialValue,
    (_, newValue: boolean) => newValue,
  );

  const updateIsActive = async (newValue: boolean) => {
    setOptimisticIsActive(newValue);
    await setAppSetting(appSettingKey, newValue); // this is a server action which calls `revalidateTag`
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
