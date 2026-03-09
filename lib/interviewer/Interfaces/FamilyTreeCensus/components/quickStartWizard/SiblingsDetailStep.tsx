'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PersonFields';
import { type PersonDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

export default function SiblingsDetailStep() {
  const { data, setStepData } = useWizard();
  const siblingCount = (data.siblingCount as number | undefined) ?? 0;

  const [siblings, setSiblings] = useState<PersonDetail[]>(() => {
    const existing = data.siblings as PersonDetail[] | undefined;
    if (existing?.length === siblingCount) return existing;
    return Array.from({ length: siblingCount }, (_, i) => ({
      name: existing?.[i]?.name ?? '',
      sex: existing?.[i]?.sex,
      gender: existing?.[i]?.gender,
    }));
  });

  useEffect(() => {
    setStepData({ siblings });
  }, [siblings, setStepData]);

  const updateSibling = (index: number, updates: Partial<PersonDetail>) => {
    setSiblings((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    );
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      {siblings.map((sibling, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">Sibling {i + 1}</h3>
          <PersonFields
            index={i}
            prefix="sibling"
            name={sibling.name}
            sex={sibling.sex}
            gender={sibling.gender}
            onNameChange={(name) => updateSibling(i, { name })}
            onSexChange={(sex) => updateSibling(i, { sex })}
            onGenderChange={(gender) => updateSibling(i, { gender })}
          />
        </div>
      ))}
    </div>
  );
}
