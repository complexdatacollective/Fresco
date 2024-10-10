import { setAppSetting } from '~/actions/appSettings';
import { getAppSetting } from '~/queries/appSettings';
import SwitchWithOptimisticUpdate from './SwitchWithOptimisticUpdate';

const AnonymousRecruitmentSwitch = async () => {
  const allowAnonymousRecruitment = await getAppSetting(
    'allowAnonymousRecruitment',
  );

  console.log(allowAnonymousRecruitment);

  return (
    <SwitchWithOptimisticUpdate
      initialValue={allowAnonymousRecruitment}
      name="allowAnonymousRecruitment"
      action={setAppSetting}
    />
  );
};

export default AnonymousRecruitmentSwitch;
