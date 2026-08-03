import 'server-only';
import { setAppSetting } from '~/actions/appSettings';
import { getAppSetting } from '~/queries/appSettings';
import Switch from '~/components/SwitchWithOptimisticUpdate';

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
