'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import { STEP_INDICES } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/stepIndices';

export default function SiblingsCountStep() {
  const { data, setStepData, setBeforeNext, goToStep } = useWizard();
  const [count, setCount] = useState(
    (data.siblingCount as number | undefined) ?? 0,
  );

  useEffect(() => {
    setStepData({ siblingCount: count });
  }, [count, setStepData]);

  useEffect(() => {
    setBeforeNext(() => {
      if (count === 0) {
        goToStep(STEP_INDICES.PARTNER);
        return false;
      }
      return true;
    });
  }, [count, setBeforeNext, goToStep]);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        name="siblingCount"
        label="How many siblings do you have?"
        component={NumberCounterField}
        value={count}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setCount(newCount);
          setStepData({ siblingCount: newCount });
        }}
      />
    </div>
  );
}
