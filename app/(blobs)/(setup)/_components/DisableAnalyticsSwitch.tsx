'use client';
import { setAppSetting } from '~/actions/appSettings';
import SwitchWithOptimisticUpdate from '~/components/SwitchWithOptimisticUpdate';

const DisableAnalyticsSwitch = ({
  disableAnalytics,
}: {
  disableAnalytics: boolean;
}) => {
  return (
    <SwitchWithOptimisticUpdate
      initialValue={disableAnalytics}
      name="disableAnalytics"
      action={setAppSetting}
    />
  );
};

export default DisableAnalyticsSwitch;
