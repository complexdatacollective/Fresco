'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PersonFields';
import {
  type BioParentDetail,
  type ParentDetail,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

export default function BioParentsStep() {
  const { data, setStepData } = useWizard();

  const parents = (data.parents as ParentDetail[] | undefined) ?? [];
  const bioParentCount = parents.filter(
    (p) => p.edgeType === 'bio-parent',
  ).length;
  const missingCount = Math.max(0, 2 - bioParentCount);

  const [bioParents, setBioParents] = useState<BioParentDetail[]>(() => {
    const existing = data.bioParents as BioParentDetail[] | undefined;
    if (existing?.length === missingCount) return existing;
    return Array.from({ length: missingCount }, (_, i) => ({
      name: existing?.[i]?.name ?? '',
      sex: existing?.[i]?.sex,
      gender: existing?.[i]?.gender,
      nameKnown: existing?.[i]?.nameKnown ?? false,
    }));
  });

  useEffect(() => {
    setStepData({ bioParents });
  }, [bioParents, setStepData]);

  const updateBioParent = (
    index: number,
    updates: Partial<BioParentDetail>,
  ) => {
    setBioParents((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );
  };

  if (bioParentCount >= 2) {
    return (
      <div className="flex flex-col gap-3 pt-4">
        <p className="text-muted-foreground text-sm">
          All biological parents already identified. Click Continue to proceed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <p className="text-sm text-current/70">
        For the pedigree, we need information about biological parents.
        {bioParentCount > 0
          ? ` You identified ${bioParentCount} biological parent${bioParentCount === 1 ? '' : 's'} above.`
          : ''}{' '}
        Please tell us about the {missingCount === 1 ? 'other' : ''} biological
        parent{missingCount > 1 ? 's' : ''}.
      </p>
      {bioParents.map((bp, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">
            Biological parent {bioParentCount + i + 1}
          </h3>
          <UnconnectedField
            name={`bioParent-${i}-nameKnown`}
            label="Do you know this person's name?"
            component={ToggleField}
            value={bp.nameKnown}
            onChange={(v) => {
              updateBioParent(i, {
                nameKnown: v ?? false,
                name: v ? bp.name : '',
              });
            }}
          />
          <PersonFields
            index={i}
            prefix="bioParent"
            name={bp.name}
            sex={bp.sex}
            gender={bp.gender}
            showName={bp.nameKnown}
            onNameChange={(name) => updateBioParent(i, { name })}
            onSexChange={(sex) => updateBioParent(i, { sex })}
            onGenderChange={(gender) => updateBioParent(i, { gender })}
          />
        </div>
      ))}
    </div>
  );
}
