'use client';

import { useEffect, useState } from 'react';
import Heading from '~/components/typography/Heading';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PersonFields';
import { type ParentDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

export default function ParentsDetailStep() {
  const { data, setStepData, setNextEnabled } = useWizard();
  const parentCount = (data.parentCount as number | undefined) ?? 0;

  const [parents, setParents] = useState<ParentDetail[]>(() => {
    const existing = data.parents as ParentDetail[] | undefined;
    if (existing?.length === parentCount) return existing;
    return Array.from({ length: parentCount }, (_, i) => ({
      name: existing?.[i]?.name ?? '',
      nameKnown: existing?.[i]?.nameKnown ?? false,
      sex: existing?.[i]?.sex,
      gender: existing?.[i]?.gender,
      edgeType: existing?.[i]?.edgeType ?? 'parent',
      biological: existing?.[i]?.biological ?? true,
    }));
  });

  useEffect(() => {
    setStepData({ parents });
  }, [parents, setStepData]);

  useEffect(() => {
    const allValid = parents.every((p) => p.sex && p.gender);
    setNextEnabled(allValid);
  }, [parents, setNextEnabled]);

  const updateParent = (index: number, updates: Partial<ParentDetail>) => {
    setParents((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      {parents.map((parent, i) => (
        <div key={i} className="flex flex-col gap-3 rounded border p-4">
          <Heading level="h3">Parent {i + 1}</Heading>
          <UnconnectedField
            name={`parent-${i}-nameKnown`}
            label="I know this person's name"
            component={ToggleField}
            value={parent.nameKnown}
            onChange={(v) => {
              updateParent(i, {
                nameKnown: v ?? false,
                name: v ? parent.name : '',
              });
            }}
          />
          <PersonFields
            index={i}
            prefix="parent"
            name={parent.name}
            sex={parent.sex}
            gender={parent.gender}
            showName={parent.nameKnown}
            onNameChange={(name) => updateParent(i, { name })}
            onSexChange={(sex) => updateParent(i, { sex })}
            onGenderChange={(gender) => updateParent(i, { gender })}
          />
          <UnconnectedField
            name={`parent-${i}-isBioParent`}
            label="This is my biological parent"
            component={ToggleField}
            value={parent.biological !== false}
            onChange={(v) => {
              updateParent(i, { biological: v ?? true });
            }}
          />
        </div>
      ))}
    </div>
  );
}
