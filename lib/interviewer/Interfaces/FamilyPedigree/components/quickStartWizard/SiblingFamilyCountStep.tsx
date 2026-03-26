'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import BooleanField from '~/lib/form/components/fields/Boolean';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import {
  type PersonDetail,
  type SiblingDetail,
  type SiblingFamily,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

export default function SiblingFamilyCountStep() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const siblings = useMemo(
    () => (data.siblings as SiblingDetail[] | undefined) ?? [],
    [data.siblings],
  );
  const existingFamilies = data.siblingFamilies as SiblingFamily[] | undefined;

  const [hasChildrenMap, setHasChildrenMap] = useState<
    Record<number, boolean | undefined>
  >(() => {
    const initial: Record<number, boolean | undefined> = {};
    siblings.forEach((_, i) => {
      const existing = existingFamilies?.find((f) => f.siblingIndex === i);
      initial[i] = existing !== undefined ? true : undefined;
    });
    return initial;
  });

  const [childCounts, setChildCounts] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    siblings.forEach((_, i) => {
      const existing = existingFamilies?.find((f) => f.siblingIndex === i);
      initial[i] = existing?.children.length ?? 1;
    });
    return initial;
  });

  const [hasPartnerMap, setHasPartnerMap] = useState<
    Record<number, boolean | undefined>
  >(() => {
    const initial: Record<number, boolean | undefined> = {};
    siblings.forEach((_, i) => {
      const existing = existingFamilies?.find((f) => f.siblingIndex === i);
      initial[i] = existing?.hasPartner;
    });
    return initial;
  });

  const hasChildrenMapRef = useRef(hasChildrenMap);
  hasChildrenMapRef.current = hasChildrenMap;

  const childCountsRef = useRef(childCounts);
  childCountsRef.current = childCounts;

  const hasPartnerMapRef = useRef(hasPartnerMap);
  hasPartnerMapRef.current = hasPartnerMap;

  useEffect(() => {
    setBeforeNext(() => {
      const currentHasChildren = hasChildrenMapRef.current;
      const currentChildCounts = childCountsRef.current;
      const currentHasPartner = hasPartnerMapRef.current;

      const siblingFamilies: SiblingFamily[] = siblings
        .map((_, i) => {
          if (!currentHasChildren[i]) return null;
          const family: SiblingFamily = {
            siblingIndex: i,
            hasPartner: currentHasPartner[i] ?? false,
            children: [] as PersonDetail[],
          };
          return family;
        })
        .filter((f): f is SiblingFamily => f !== null);

      const siblingFamilyChildCounts = Object.fromEntries(
        siblings
          .filter((_, i) => currentHasChildren[i])
          .map((_, i) => [i, currentChildCounts[i] ?? 1]),
      );

      setStepData({ siblingFamilies, siblingFamilyChildCounts });
      return true;
    });
  }, [setBeforeNext, setStepData, siblings]);

  if (siblings.length === 0) {
    return (
      <div className="pt-4">
        <p className="text-muted-foreground text-sm">No siblings to detail.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      {siblings.map((sibling, i) => {
        const siblingName = sibling.name || `Sibling ${i + 1}`;
        const hasChildren = hasChildrenMap[i];
        const childCount = childCounts[i] ?? 1;

        return (
          <div key={i} className="flex flex-col gap-3">
            <UnconnectedField
              name={`sibling-${i}-hasChildren`}
              label={`Does ${siblingName} have children?`}
              component={BooleanField}
              value={hasChildren}
              onChange={(v: boolean | undefined) => {
                setHasChildrenMap((prev) => ({ ...prev, [i]: v }));
              }}
            />
            {hasChildren && (
              <>
                <UnconnectedField
                  name={`sibling-${i}-childCount`}
                  inline
                  label="How many?"
                  component={NumberCounterField}
                  value={childCount}
                  minValue={1}
                  maxValue={20}
                  onChange={(v) => {
                    setChildCounts((prev) => ({ ...prev, [i]: v ?? 1 }));
                  }}
                />
                <UnconnectedField
                  name={`sibling-${i}-hasPartner`}
                  label={`Does ${siblingName} have a partner?`}
                  component={BooleanField}
                  value={hasPartnerMap[i]}
                  onChange={(v: boolean | undefined) => {
                    setHasPartnerMap((prev) => ({ ...prev, [i]: v }));
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
