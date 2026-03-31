'use client';

import { useMemo } from 'react';
import Field from '~/lib/form/components/Field/Field';
import InputField from '~/lib/form/components/fields/InputField';
import useFormStore from '~/lib/form/hooks/useFormStore';
import {
  getAllParents,
  getParentDisplayName,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/getAllParents';

export default function AuntUncleCountStep() {
  const getFieldState = useFormStore((s) => s.getFieldState);
  const allParents = useMemo(
    () => getAllParents((name) => getFieldState(name)?.value),
    [getFieldState],
  );

  return (
    <div className="flex flex-col gap-3 pt-4">
      {allParents.map((entry, idx) => (
        <Field
          key={idx}
          name={`auntUncleCount-${idx}`}
          inline
          label={`How many siblings does ${getParentDisplayName(entry, idx)} have?`}
          component={InputField}
          type="number"
          initialValue="0"
          min={0}
          max={20}
        />
      ))}
    </div>
  );
}
