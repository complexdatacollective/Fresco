'use client';

import { useMemo } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { useFormValue } from '~/lib/form/hooks/useFormValue';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

const MAX_SIBLINGS = 20;

const SIBLING_SHARED_PARENT_FIELDS = Array.from(
  { length: MAX_SIBLINGS },
  (_, i) => [`sibling-${i}-sharedParents`, `sibling-${i}-name`],
).flat();

export default function HalfSiblingParentsStep() {
  const {
    siblingCount: rawSiblingCount,
    parentCount: rawParentCount,
    ...siblingValues
  } = useFormValue([
    'siblingCount',
    'parentCount',
    'ego-parents',
    ...SIBLING_SHARED_PARENT_FIELDS,
  ]);

  const siblingCount = Number(rawSiblingCount ?? 0);
  const parentCount = Number(rawParentCount ?? 0);

  const rawEgoParents = siblingValues['ego-parents'];
  const egoParentIndices = useMemo(() => {
    if (Array.isArray(rawEgoParents)) {
      return rawEgoParents.map((v) => Number(v));
    }
    return Array.from({ length: parentCount }, (_, i) => i);
  }, [rawEgoParents, parentCount]);

  const egoParentSet = useMemo(
    () => new Set(egoParentIndices),
    [egoParentIndices],
  );

  const halfSiblings = useMemo(() => {
    const result: { siblingIndex: number; siblingName: string }[] = [];

    for (let i = 0; i < siblingCount; i++) {
      const rawShared = siblingValues[`sibling-${i}-sharedParents`];
      const sharedIndices = Array.isArray(rawShared)
        ? rawShared.map((v) => Number(v))
        : [];
      const sharedSet = new Set(sharedIndices);
      const isStrictSubset =
        sharedSet.size < egoParentSet.size &&
        [...sharedSet].every((idx) => egoParentSet.has(idx));
      if (isStrictSubset) {
        const name =
          (siblingValues[`sibling-${i}-name`] as string | undefined) ??
          `Sibling ${i + 1}`;
        result.push({ siblingIndex: i, siblingName: name });
      }
    }

    return result;
  }, [siblingCount, egoParentSet, siblingValues]);

  if (halfSiblings.length === 0) {
    return (
      <Paragraph>
        No half-siblings were identified, so there are no other parents to
        collect.
      </Paragraph>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {halfSiblings.map(({ siblingIndex, siblingName }) => (
        <Surface key={siblingIndex} level={1} spacing="sm">
          <Heading level="h3">{siblingName}&apos;s other parent</Heading>
          <Paragraph>
            You mentioned that {siblingName} doesn&apos;t share all your
            parents.
          </Paragraph>
          <PersonFields namespace={`halfSibParent-${siblingIndex}`} />
        </Surface>
      ))}
    </div>
  );
}
