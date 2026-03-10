'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';

export default function ChildrenWithPartnerCountStep() {
  const { data, setStepData } = useWizard();
  const [count, setCount] = useState(
    (data.childrenWithPartnerCount as number | undefined) ?? 0,
  );

  useEffect(() => {
    setStepData({ childrenWithPartnerCount: count });
  }, [count, setStepData]);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        name="childrenWithPartnerCount"
        label="How many children do you have with your partner?"
        component={NumberCounterField}
        value={count}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setCount(newCount);
          setStepData({ childrenWithPartnerCount: newCount });
        }}
      />
    </div>
  );
}
