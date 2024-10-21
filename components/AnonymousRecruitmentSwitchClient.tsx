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
      updateValue={async (value) => {
        await setAppSetting('allowAnonymousRecruitment', value);
        return value;
      }}
    />
  );
};

export default AnonymousRecruitmentSwitchClient;
