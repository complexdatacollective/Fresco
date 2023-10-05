'use client';

import { Switch } from '~/components/ui/switch';
import { trpc } from '~/app/_trpc/client';
import { useEffect, useState } from 'react';

interface AnonymousRecruitmentSwitchProps {
  initialCheckedState: boolean;
}

const AnonymousRecruitmentSwitch = ({
  initialCheckedState,
}: AnonymousRecruitmentSwitchProps) => {
  const utils = trpc.useContext();
  const [checked, setChecked] = useState(initialCheckedState);

  const allowAnonymousRecruitment =
    trpc.metadata.get.allowAnonymousRecruitment.useQuery().data;

  useEffect(() => {
    if (allowAnonymousRecruitment !== undefined) {
      setChecked(allowAnonymousRecruitment);
      utils.metadata.get.allowAnonymousRecruitment.refetch();
    }
  }, [allowAnonymousRecruitment, utils.metadata.get.allowAnonymousRecruitment]);

  const updateAnonymousRecruitment =
    trpc.metadata.updateAnonymousRecruitment.useMutation();
  const handleCheckedChange = async () => {
    await updateAnonymousRecruitment.mutateAsync();
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Anonymous Recruitment</h3>
          <p className="text-sm text-gray-600">
            Allow anonymous recruitment of participants.
          </p>
        </div>
        <Switch checked={checked} onCheckedChange={handleCheckedChange} />
      </div>
    </div>
  );
};

export default AnonymousRecruitmentSwitch;
