import { getAppSetting } from '~/queries/appSettings';
import SwitchWithOptimisticUpdate from './AppSettingsSwitchWithOptimisticUpdate';

const AnonymousRecruitmentSwitch = async () => {
  const allowAnonymousRecruitment = await getAppSetting(
    'allowAnonymousRecruitment',
  );

  if (allowAnonymousRecruitment === null) {
    return null;
  }

  return (
    <SwitchWithOptimisticUpdate
      initialValue={allowAnonymousRecruitment}
      name="allowAnonymousRecruitment"
      appSettingKey="allowAnonymousRecruitment"
    />
  );
};

export default AnonymousRecruitmentSwitch;
