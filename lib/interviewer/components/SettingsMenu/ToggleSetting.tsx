'use client';

import { Switch as SwitchUI } from '~/components/ui/switch';
import { useOptimistic, useTransition } from 'react';

const ToggleSetting = ({
  initialSetting,
  toggleSettingFunction,
  title,
  description,
}: {
  initialSetting: boolean;
  toggleSettingFunction: (state: boolean) => Promise<void>;
  title: string;
  description: string;
}) => {
  const [, startTransition] = useTransition();
  const [optimisticToggleSetting, setOptimisticToggleSetting] = useOptimistic(
    initialSetting,
    (state: boolean, newState: boolean) => newState,
  );

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <SwitchUI
          name="allowAnonymousRecruitment"
          checked={optimisticToggleSetting}
          onCheckedChange={(value) => {
            startTransition(async () => {
              setOptimisticToggleSetting(value);
              await toggleSettingFunction(value);
            });
          }}
        />
        <div>
          <p className="text-md font-bold">{title}</p>
          <p className="text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default ToggleSetting;
