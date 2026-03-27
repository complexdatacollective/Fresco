'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import InputField from '~/lib/form/components/fields/InputField';
import {
  getAllParents,
  getParentDisplayName,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/getAllParents';
import { type ParentBranch } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

export default function AuntUncleCountStep() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const allParents = useMemo(() => getAllParents(data), [data]);
  const existingBranches = data.parentBranches as ParentBranch[] | undefined;

  const [counts, setCounts] = useState<string[]>(() =>
    allParents.map((_, idx) => {
      const existing = existingBranches?.find((b) => b.parentIndex === idx);
      return existing?.auntUncleCount?.toString() ?? '0';
    }),
  );

  const countsRef = useRef(counts);
  countsRef.current = counts;

  useEffect(() => {
    setBeforeNext(() => {
      const currentCounts = countsRef.current;
      const parentBranches: ParentBranch[] = allParents.map((_, idx) => {
        const existing = existingBranches?.find((b) => b.parentIndex === idx);
        return {
          parentIndex: idx,
          grandparents: existing?.grandparents ?? [
            { name: '', nameKnown: false },
            { name: '', nameKnown: false },
          ],
          auntUncleCount: Number(currentCounts[idx]) || 0,
          auntsUncles: existing?.auntsUncles ?? [],
        };
      });

      setStepData({ parentBranches });
      return true;
    });
  }, [setBeforeNext, setStepData, allParents, existingBranches]);

  return (
    <div className="flex flex-col gap-3 pt-4">
      {allParents.map((entry, idx) => (
        <UnconnectedField
          key={idx}
          name={`auntUncleCount-${idx}`}
          inline
          label={`How many siblings does ${getParentDisplayName(entry, idx)} have?`}
          component={InputField}
          type="number"
          value={counts[idx] ?? '0'}
          min={0}
          max={20}
          onChange={(v) => {
            const newCount = v ?? '0';
            setCounts((prev) => prev.map((c, i) => (i === idx ? newCount : c)));
          }}
        />
      ))}
    </div>
  );
}
