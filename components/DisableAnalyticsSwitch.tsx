import { setAppSetting } from '~/actions/appSettings';
import SwitchWithOptimisticUpdate from '~/components/SwitchWithOptimisticUpdate';
import { getAppSetting } from '~/queries/appSettings';

const DisableAnalyticsSwitch = async () => {
  const disableAnalytics = await getAppSetting('disableAnalytics');
  return (
    <SwitchWithOptimisticUpdate
      initialValue={disableAnalytics}
      updateValue={async (value) => {
        'use server';
        await setAppSetting('disableAnalytics', value);
        return value;
      }}
    />
  );
};

export default DisableAnalyticsSwitch;
