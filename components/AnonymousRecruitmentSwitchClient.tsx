'use client';
import SwitchWithOptimisticUpdate from './SwitchWithOptimisticUpdate';
import { setAnonymousRecruitment } from '~/actions/appSettings';

const AnonymousRecruitmentSwitchClient = ({
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

export default AnonymousRecruitmentSwitchClient;
