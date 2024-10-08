'use client';
import { setAppSetting } from '~/actions/appSettings';
import SwitchWithOptimisticUpdate from './SwitchWithOptimisticUpdate';

const AnonymousRecruitmentSwitchClient = ({
  allowAnonymousRecruitment,
}: {
  allowAnonymousRecruitment: boolean;
}) => {
  return (
    <SwitchWithOptimisticUpdate
      initialValue={allowAnonymousRecruitment}
      name="allowAnonymousRecruitment"
      action={setAppSetting}
    />
  );
};

export default AnonymousRecruitmentSwitchClient;
