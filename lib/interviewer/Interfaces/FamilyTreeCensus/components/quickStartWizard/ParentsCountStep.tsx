'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import ToggleField from '~/lib/form/components/fields/ToggleField';

export default function ParentsCountStep() {
  const { data, setStepData } = useWizard();
  const [parentCount, setParentCount] = useState(
    (data.parentCount as number | undefined) ?? 2,
  );
  const [siblingCount, setSiblingCount] = useState(
    (data.siblingCount as number | undefined) ?? 0,
  );
  const [hasPartner, setHasPartner] = useState(
    (data.hasPartner as boolean | undefined) ?? false,
  );

  useEffect(() => {
    setStepData({ parentCount, siblingCount, hasPartner });
  }, [parentCount, siblingCount, hasPartner, setStepData]);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <UnconnectedField
        name="parentCount"
        inline
        label="How many parents do you have?"
        hint="This includes biological, step, adoptive, and anyone else that you identify as a parent."
        component={NumberCounterField}
        value={parentCount}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setParentCount(newCount);
        }}
      />
      <UnconnectedField
        name="siblingCount"
        inline
        label="How many siblings do you have?"
        component={NumberCounterField}
        value={siblingCount}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setSiblingCount(newCount);
        }}
      />
      <UnconnectedField
        name="hasPartner"
        inline
        label="Do you have a partner?"
        component={ToggleField}
        value={hasPartner}
        onChange={(v) => setHasPartner(!!v)}
      />
    </div>
  );
}
