'use client';

import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { Switch } from '~/components/ui/switch';

const AnonymousRecruitmentSwitch = () => {
  const [loading, setLoading] = useState(false);
  const utils = trpc.useContext();

  const updateAnonymousRecruitment =
    trpc.metadata.updateAnonymousRecruitment.useMutation();

  const allowAnonymousRecruitment =
    trpc.metadata.get.allowAnonymousRecruitment.useQuery(undefined, {
      onSuccess: (data) => {
        setChecked(data);
      },
    });

  const [checked, setChecked] = useState(allowAnonymousRecruitment.data);

  const handleCheckedChange = async () => {
    // Optimistically update the UI
    setChecked(!checked);
    setLoading(true);

    // Update the setting in the database
    try {
      await updateAnonymousRecruitment.mutateAsync();
      await utils.metadata.get.allowAnonymousRecruitment.invalidate();
      setLoading(false);
    } catch (error) {
      console.error('Failed to update setting:', error);

      // Revert the UI state on failure
      setChecked(!checked);
    }
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
        <Switch
          checked={checked}
          onCheckedChange={handleCheckedChange}
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default AnonymousRecruitmentSwitch;
