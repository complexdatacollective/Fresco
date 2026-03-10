'use client';

import { useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';

export default function OtherChildrenCountStep() {
  const { data, setStepData } = useWizard();
  const [count, setCount] = useState(
    (data.otherChildrenCount as number | undefined) ?? 0,
  );

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        name="otherChildrenCount"
        inline
        label="How many children do you have from other relationships?"
        component={NumberCounterField}
        value={count}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setCount(newCount);
          setStepData({ otherChildrenCount: newCount });
        }}
      />
    </div>
  );
}
