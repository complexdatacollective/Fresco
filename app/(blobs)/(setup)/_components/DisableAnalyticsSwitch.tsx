'use client';
import { setDisableAnalytics } from '~/actions/environment';
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
      action={setDisableAnalytics}
    />
  );
};

export default DisableAnalyticsSwitch;
