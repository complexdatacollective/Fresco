'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import { STEP_INDICES } from './stepIndices';

export default function ParentsCountStep() {
  const { data, setStepData, setBeforeNext, goToStep } = useWizard();
  const [count, setCount] = useState(
    (data.parentCount as number | undefined) ?? 2,
  );

  useEffect(() => {
    setStepData({ parentCount: count });
  }, [count, setStepData]);

  useEffect(() => {
    setBeforeNext(() => {
      if (count === 0) {
        goToStep(STEP_INDICES.BIO_PARENTS);
        return false;
      }
      return true;
    });
  }, [count, setBeforeNext, goToStep]);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        name="parentCount"
        label="How many parents do you have?"
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
