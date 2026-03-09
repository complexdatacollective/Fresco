'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import { type ParentDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import PersonFields from './PersonFields';
import { PARENT_EDGE_TYPE_OPTIONS, isParentEdgeType } from './fieldOptions';
import { STEP_INDICES } from './stepIndices';

export default function ParentsDetailStep() {
  const { data, setStepData, setBeforeNext, goToStep } = useWizard();
  const parentCount = (data.parentCount as number | undefined) ?? 0;

  const [parents, setParents] = useState<ParentDetail[]>(() => {
    const existing = data.parents as ParentDetail[] | undefined;
    if (existing?.length === parentCount) return existing;
    return Array.from({ length: parentCount }, (_, i) => ({
      name: existing?.[i]?.name ?? '',
      sex: existing?.[i]?.sex,
      gender: existing?.[i]?.gender,
      edgeType: existing?.[i]?.edgeType ?? 'social-parent',
    }));
  });

  useEffect(() => {
    setStepData({ parents });
  }, [parents, setStepData]);

  useEffect(() => {
    const bioCount = parents.filter((p) => p.edgeType === 'bio-parent').length;
    setBeforeNext(() => {
      if (bioCount >= 2) {
        goToStep(STEP_INDICES.SIBLINGS_COUNT);
        return false;
      }
      return true;
    });
  }, [parents, setBeforeNext, goToStep]);

  const updateParent = (index: number, updates: Partial<ParentDetail>) => {
    setParents((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      {parents.map((parent, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">Parent {i + 1}</h3>
          <PersonFields
            index={i}
            prefix="parent"
            name={parent.name}
            sex={parent.sex}
            gender={parent.gender}
            onNameChange={(name) => updateParent(i, { name })}
            onSexChange={(sex) => updateParent(i, { sex })}
            onGenderChange={(gender) => updateParent(i, { gender })}
          />
          <UnconnectedField
            name={`parent-${i}-edgeType`}
            label="Relationship type"
            component={RadioGroupField}
            options={PARENT_EDGE_TYPE_OPTIONS}
            value={parent.edgeType}
            onChange={(v) => {
              if (typeof v === 'string' && isParentEdgeType(v)) {
                updateParent(i, { edgeType: v });
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}
