'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import InputField from '~/lib/form/components/fields/InputField';

export default function OtherChildrenCountStep() {
  const { data, setStepData } = useWizard();
  const [count, setCount] = useState(
    () => (data.otherChildrenCount as number | undefined) ?? 0,
  );

  useEffect(() => {
    if (data.otherChildrenCount === undefined) {
      setStepData({ otherChildrenCount: count });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        name="otherChildrenCount"
        inline
        label="How many children do you have from other relationships?"
        component={InputField}
        type="number"
        value={String(count)}
        min={0}
        max={20}
        onChange={(v) => {
          const newCount = Number(v) || 0;
          setCount(newCount);
          setStepData({ otherChildrenCount: newCount });
        }}
      />
    </div>
  );
}
