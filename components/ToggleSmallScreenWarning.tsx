import { setAppSetting } from '~/actions/appSettings';
import { getAppSetting } from '~/queries/appSettings';
import SwitchWithOptimisticUpdate from './SwitchWithOptimisticUpdate';

const ToggleSmallScreenWarning = async () => {
  const disableSmallScreenOverlay = await getAppSetting(
    'disableSmallScreenOverlay',
  );

  return (
    <SwitchWithOptimisticUpdate
      initialValue={disableSmallScreenOverlay}
      updateValue={async (value) => {
        'use server';
        await setAppSetting('disableSmallScreenOverlay', value);
        return value;
      }}
    />
  );
};

export default ToggleSmallScreenWarning;
