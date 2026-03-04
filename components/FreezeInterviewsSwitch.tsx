import 'server-only';
import { setAppSetting } from '~/actions/appSettings';
import { getAppSetting } from '~/queries/appSettings';
import Switch from './SwitchWithOptimisticUpdate';

const FreezeInterviewsSwitch = async () => {
  const freezeInterviewsAfterCompletion = await getAppSetting(
    'freezeInterviewsAfterCompletion',
  );

  if (freezeInterviewsAfterCompletion === null) {
    return null;
  }

  return (
    <Switch
      initialValue={freezeInterviewsAfterCompletion}
      updateValue={async (value) => {
        'use server';
        await setAppSetting('freezeInterviewsAfterCompletion', value);
        return value;
      }}
    />
  );
};

export default FreezeInterviewsSwitch;
