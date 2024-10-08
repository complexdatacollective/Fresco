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
      name="DISABLE_ANALYTICS"
      action={setAppSetting}
    />
  );
};

export default DisableAnalyticsSwitch;
