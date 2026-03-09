'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';

export default function ParentsCountStep() {
  const { data, setStepData } = useWizard();
  const [count, setCount] = useState(
    (data.parentCount as number | undefined) ?? 2,
  );

  useEffect(() => {
    setStepData({ parentCount: count });
  }, [count, setStepData]);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        name="parentCount"
        label="How many parents do you have?"
        hint="This includes biological, step, adoptive, and anyone else that you identify as a parent."
        component={NumberCounterField}
        value={count}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setCount(newCount);
          setStepData({ parentCount: newCount });
        }}
      />
    </div>
  );
}
