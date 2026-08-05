import 'server-only';
import { setAppSetting } from '~/actions/appSettings';
import Switch from '~/components/SwitchWithOptimisticUpdate';
import { getAppSetting } from '~/queries/appSettings';

const InterviewDataApiSwitch = async () => {
  const enableInterviewDataApi = await getAppSetting('enableInterviewDataApi');

  if (enableInterviewDataApi === null) {
    return null;
  }

  return (
    <Switch
      initialValue={enableInterviewDataApi}
      updateValue={async (value) => {
        'use server';
        await setAppSetting('enableInterviewDataApi', value);
        return value;
      }}
    />
  );
};

export default InterviewDataApiSwitch;
