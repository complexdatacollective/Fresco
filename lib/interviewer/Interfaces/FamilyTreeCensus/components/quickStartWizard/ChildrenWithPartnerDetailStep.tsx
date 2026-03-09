'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PersonFields';
import { type PersonDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

export default function ChildrenWithPartnerDetailStep() {
  const { data, setStepData } = useWizard();
  const childCount = (data.childrenWithPartnerCount as number | undefined) ?? 0;

  const [children, setChildren] = useState<PersonDetail[]>(() => {
    const existing = data.childrenWithPartner as PersonDetail[] | undefined;
    if (existing?.length === childCount) return existing;
    return Array.from({ length: childCount }, (_, i) => ({
      name: existing?.[i]?.name ?? '',
      sex: existing?.[i]?.sex,
      gender: existing?.[i]?.gender,
    }));
  });

  useEffect(() => {
    setStepData({ childrenWithPartner: children });
  }, [children, setStepData]);

  const updateChild = (index: number, updates: Partial<PersonDetail>) => {
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    );
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      {children.map((child, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">Child {i + 1}</h3>
          <PersonFields
            index={i}
            prefix="childWithPartner"
            name={child.name}
            sex={child.sex}
            gender={child.gender}
            onNameChange={(name) => updateChild(i, { name })}
            onSexChange={(sex) => updateChild(i, { sex })}
            onGenderChange={(gender) => updateChild(i, { gender })}
          />
        </div>
      ))}
    </div>
  );
}
