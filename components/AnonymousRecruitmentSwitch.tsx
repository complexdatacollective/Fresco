import { getAnonymousRecruitmentStatus } from '~/queries/appSettings';
import SwitchWithOptimisticUpdate from './SwitchWithOptimisticUpdate';
import { setAnonymousRecruitment } from '~/actions/appSettings';

const AnonymousRecruitmentSwitch = async () => {
  const allowAnonymousRecruitment = await getAnonymousRecruitmentStatus();
  return (
    <SwitchWithOptimisticUpdate
      initialValue={allowAnonymousRecruitment}
      name="allowAnonymousRecruitment"
      action={setAnonymousRecruitment}
    />
  );
};

export default AnonymousRecruitmentSwitch;
