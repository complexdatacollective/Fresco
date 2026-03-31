'use client';

import { useMemo } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { useFormValue } from '~/lib/form/hooks/useFormValue';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

const MAX_SIBLINGS = 20;

const SIBLING_FAMILY_FIELDS = Array.from({ length: MAX_SIBLINGS }, (_, i) => [
  `sibling-${i}-name`,
  `sibling-${i}-hasChildren`,
  `sibling-${i}-hasPartner`,
  `sibling-${i}-childCount`,
]).flat();

export default function SiblingFamilyDetailStep() {
  const { siblingCount: rawSiblingCount } = useFormValue(['siblingCount']);
  const siblingCount = Number(rawSiblingCount ?? 0);
  const siblingFamilyValues = useFormValue(SIBLING_FAMILY_FIELDS);

  const siblingFamiliesWithChildren = useMemo(() => {
    const families: {
      sibIdx: number;
      siblingName: string;
      hasPartner: boolean;
      childCount: number;
    }[] = [];

    for (let i = 0; i < siblingCount; i++) {
      const hasChildren =
        siblingFamilyValues[`sibling-${i}-hasChildren`] === true;
      if (!hasChildren) continue;

      const name = siblingFamilyValues[`sibling-${i}-name`] as
        | string
        | undefined;
      const hasPartner =
        siblingFamilyValues[`sibling-${i}-hasPartner`] === true;
      const childCount = Number(
        siblingFamilyValues[`sibling-${i}-childCount`] ?? 1,
      );

      families.push({
        sibIdx: i,
        siblingName: name ?? `Sibling ${i + 1}`,
        hasPartner,
        childCount,
      });
    }

    return families;
  }, [siblingCount, siblingFamilyValues]);

  if (siblingFamiliesWithChildren.length === 0) {
    return (
      <div className="pt-4">
        <p className="text-muted-foreground text-sm">
          No siblings with children to detail.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      {siblingFamiliesWithChildren.map(
        ({ sibIdx, siblingName, hasPartner, childCount }) => (
          <Surface key={sibIdx} level={1} spacing="sm">
            <Heading level="h3">{siblingName}&apos;s family</Heading>
            {hasPartner && (
              <Surface level={2} spacing="sm">
                <Heading level="h4">{siblingName}&apos;s partner</Heading>
                <PersonFields
                  nameToggle={false}
                  namespace={`siblingPartner-${sibIdx}`}
                />
              </Surface>
            )}
            {Array.from({ length: childCount }, (_, childIdx) => (
              <Surface key={childIdx} level={2} spacing="sm">
                <Heading level="h4">
                  {siblingName}&apos;s child {childIdx + 1}
                </Heading>
                <PersonFields
                  nameToggle={false}
                  namespace={`nibling-${sibIdx}-${childIdx}`}
                />
              </Surface>
            ))}
          </Surface>
        ),
      )}
    </div>
  );
}
