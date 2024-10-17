'use client';
import SwitchWithOptimisticUpdate from '~/components/AppSettingsSwitchWithOptimisticUpdate';

const DisableAnalyticsSwitch = ({
  disableAnalytics,
}: {
  disableAnalytics: boolean;
}) => {
  return (
    <SwitchWithOptimisticUpdate
      initialValue={disableAnalytics}
      name="disableAnalytics"
      appSettingKey="disableAnalytics"
    />
  );
};

export default DisableAnalyticsSwitch;
