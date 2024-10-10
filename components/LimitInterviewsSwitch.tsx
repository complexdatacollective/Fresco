import 'server-only';
import { setAppSetting } from '~/actions/appSettings';
import { getAppSetting } from '~/queries/appSettings';
import Switch from './SwitchWithOptimisticUpdate';

const LimitInterviewsSwitch = async () => {
  const limitInterviews = await getAppSetting('limitInterviews');

  return (
    <Switch
      initialValue={limitInterviews}
      name="limitInterviews"
      action={setAppSetting}
    />
  );
};

export default LimitInterviewsSwitch;
