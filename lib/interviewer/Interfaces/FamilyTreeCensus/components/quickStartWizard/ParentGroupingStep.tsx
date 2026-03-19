'use client';

import { useEffect, useRef, useState } from 'react';
import Paragraph from '~/components/typography/Paragraph';
import { useWizard } from '~/lib/dialogs/useWizard';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import Checkbox from '~/lib/form/components/fields/Checkbox';
import { type ParentDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

export default function ParentGroupingStep() {
  return (
    <FormStoreProvider>
      <ParentGroupingForm />
    </FormStoreProvider>
  );
}

function ParentGroupingForm() {
  const { data, setStepData, setBeforeNext } = useWizard();

  const parents = (data.parents as ParentDetail[] | undefined) ?? [];
  const socialParentIndices = parents
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.raisedYou)
    .map(({ i }) => i);

  const existingGroup = data.parentGroup as number[] | undefined;

  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(existingGroup ?? socialParentIndices),
  );

  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const toggleParent = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  useEffect(() => {
    setBeforeNext(async () => {
      setStepData({ parentGroup: [...selectedRef.current] });
      return true;
    });
  }, [setStepData, setBeforeNext]);

  const getParentLabel = (index: number) => {
    const parent = parents[index];
    if (!parent) return `Parent ${index + 1}`;
    return parent.nameKnown && parent.name
      ? parent.name
      : `Parent ${index + 1}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <Paragraph>
        Which of your parents raised you together? Select all parents who
        co-parented as a unit.
      </Paragraph>
      <div className="flex flex-col gap-3">
        {socialParentIndices.map((pi) => (
          <label key={pi} className="flex items-center gap-3 text-base">
            <Checkbox
              checked={selected.has(pi)}
              onCheckedChange={() => toggleParent(pi)}
            />
            {getParentLabel(pi)}
          </label>
        ))}
      </div>
    </div>
  );
}
