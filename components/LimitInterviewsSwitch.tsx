import 'server-only';
import { getAppSetting } from '~/queries/appSettings';
import Switch from './AppSettingsSwitchWithOptimisticUpdate';

const LimitInterviewsSwitch = async () => {
  const limitInterviews = await getAppSetting('limitInterviews');

  if (limitInterviews === null) {
    return null;
  }

  return (
    <Switch
      initialValue={limitInterviews}
      name="limitInterviews"
      appSettingKey="limitInterviews"
    />
  );
};

export default LimitInterviewsSwitch;
