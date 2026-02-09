import { setAppSetting } from '~/actions/appSettings';
import { getAppSetting } from '~/queries/appSettings';
import SwitchWithOptimisticUpdate from './SwitchWithOptimisticUpdate';

const PreviewModeAuthSwitch = async () => {
  const previewModeRequireAuth = await getAppSetting('previewModeRequireAuth');

  if (previewModeRequireAuth === null) {
    return null;
  }

  return (
    <SwitchWithOptimisticUpdate
      initialValue={previewModeRequireAuth}
      updateValue={async (value) => {
        'use server';
        await setAppSetting('previewModeRequireAuth', value);
        return value;
      }}
    />
  );
};

export default PreviewModeAuthSwitch;
