'use client';
import SwitchWithOptimisticUpdate from './AppSettingsSwitchWithOptimisticUpdate';

const AnonymousRecruitmentSwitchClient = ({
  allowAnonymousRecruitment,
}: {
  allowAnonymousRecruitment: boolean;
}) => {
  return (
    <SwitchWithOptimisticUpdate
      initialValue={allowAnonymousRecruitment}
      name="allowAnonymousRecruitment"
      appSettingKey="allowAnonymousRecruitment"
    />
  );
};

export default AnonymousRecruitmentSwitchClient;
