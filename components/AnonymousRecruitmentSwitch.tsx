'use client';

import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { Switch } from '~/components/ui/switch';

interface AnonymousRecruitmentSwitchProps {
  initialCheckedState: boolean;
}

const AnonymousRecruitmentSwitch = ({
  initialCheckedState,
}: AnonymousRecruitmentSwitchProps) => {
  const [checked, setChecked] = useState(initialCheckedState);
  const [loading, setLoading] = useState(false);

  const updateAnonymousRecruitment =
    trpc.metadata.updateAnonymousRecruitment.useMutation();

  const handleCheckedChange = async () => {
    // Optimistically update the UI
    setChecked(!checked);
    setLoading(true);

    // Update the setting in the database
    try {
      await updateAnonymousRecruitment.mutateAsync();
      setLoading(false);
    } catch (error) {
      console.error('Failed to update setting:', error);

      // Revert the UI state on failure
      setChecked(checked);
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
