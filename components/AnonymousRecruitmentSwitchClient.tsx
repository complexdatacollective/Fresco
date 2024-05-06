'use client';
import SwitchWithOptimisticUpdate from './SwitchWithOptimisticUpdate';
import { setAnonymousRecruitment } from '~/actions/appSettings';

const AnonymousRecruitmentSwitch = ({
  allowAnonymousRecruitment,
}: {
  allowAnonymousRecruitment: boolean;
}) => {
  return (
    <SwitchWithOptimisticUpdate
      initialValue={allowAnonymousRecruitment}
      name="allowAnonymousRecruitment"
      action={setAnonymousRecruitment}
    />
  );
};

export default AnonymousRecruitmentSwitch;
