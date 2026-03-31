'use client';

import { useMemo } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import useFormStore from '~/lib/form/hooks/useFormStore';
import { useFormValue } from '~/lib/form/hooks/useFormValue';
import {
  getAllParents,
  getParentDisplayName,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/getAllParents';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

const MAX_PARENTS = 20;
const MAX_AUNTS_UNCLES = 20;

const AUNT_UNCLE_COUNT_FIELDS = Array.from(
  { length: MAX_PARENTS },
  (_, i) => `auntUncleCount-${i}`,
);

const AUNT_UNCLE_DETAIL_FIELDS = Array.from(
  { length: MAX_PARENTS * MAX_AUNTS_UNCLES },
  (_, i) => {
    const parentIdx = Math.floor(i / MAX_AUNTS_UNCLES);
    const auIdx = i % MAX_AUNTS_UNCLES;
    return [
      `auntUncle-${parentIdx}-${auIdx}-hasChildren`,
      `auntUncle-${parentIdx}-${auIdx}-hasPartner`,
      `auntUncle-${parentIdx}-${auIdx}-childCount`,
      `auntUncle-${parentIdx}-${auIdx}-name`,
    ];
  },
).flat();

export default function AuntUncleChildrenStep() {
  const getFieldState = useFormStore((s) => s.getFieldState);
  const allParents = useMemo(
    () => getAllParents((name) => getFieldState(name)?.value),
    [getFieldState],
  );

  const auntUncleCountValues = useFormValue(AUNT_UNCLE_COUNT_FIELDS);
  const auntUncleDetailValues = useFormValue(AUNT_UNCLE_DETAIL_FIELDS);

  const branchesWithChildren = useMemo(() => {
    return allParents
      .map((entry, parentIdx) => {
        const count = Number(
          auntUncleCountValues[`auntUncleCount-${parentIdx}`] ?? 0,
        );

        const auntsUnclesWithChildren = Array.from(
          { length: count },
          (_, auIdx) => {
            const hasChildren =
              auntUncleDetailValues[
                `auntUncle-${parentIdx}-${auIdx}-hasChildren`
              ] === true;
            const hasPartner =
              auntUncleDetailValues[
                `auntUncle-${parentIdx}-${auIdx}-hasPartner`
              ] === true;
            const childCount = Number(
              auntUncleDetailValues[
                `auntUncle-${parentIdx}-${auIdx}-childCount`
              ] ?? 0,
            );
            const name = auntUncleDetailValues[
              `auntUncle-${parentIdx}-${auIdx}-name`
            ] as string | undefined;

            return { auIdx, hasChildren, hasPartner, childCount, name };
          },
        ).filter(({ hasChildren }) => hasChildren);

        return { entry, parentIdx, auntsUnclesWithChildren };
      })
      .filter(
        ({ auntsUnclesWithChildren }) => auntsUnclesWithChildren.length > 0,
      );
  }, [allParents, auntUncleCountValues, auntUncleDetailValues]);

  if (branchesWithChildren.length === 0) {
    return (
      <div className="pt-4">
        <p className="text-muted-foreground text-sm">
          No aunts or uncles with children to detail.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      {branchesWithChildren.map(
        ({ entry, parentIdx, auntsUnclesWithChildren }) => {
          const parentName = getParentDisplayName(entry, parentIdx);

          return (
            <Surface key={parentIdx} level={1} spacing="sm">
              <Heading level="h3">
                {parentName}&apos;s siblings&apos; families
              </Heading>
              {auntsUnclesWithChildren.map(
                ({ auIdx, hasPartner, childCount, name }) => {
                  const auName = name ?? `Aunt/Uncle ${auIdx + 1}`;

                  return (
                    <Surface key={auIdx} level={2} spacing="sm">
                      <Heading level="h4">{auName}&apos;s family</Heading>
                      {hasPartner && (
                        <Surface level={3} spacing="sm">
                          <Heading level="h4">{auName}&apos;s partner</Heading>
                          <PersonFields
                            nameToggle={false}
                            namespace={`auntUnclePartner-${parentIdx}-${auIdx}`}
                          />
                        </Surface>
                      )}
                      {Array.from({ length: childCount }, (_, childIdx) => (
                        <Surface key={childIdx} level={3} spacing="sm">
                          <Heading level="h4">
                            {auName}&apos;s child {childIdx + 1}
                          </Heading>
                          <PersonFields
                            nameToggle={false}
                            namespace={`cousin-${parentIdx}-${auIdx}-${childIdx}`}
                          />
                        </Surface>
                      ))}
                    </Surface>
                  );
                },
              )}
            </Surface>
          );
        },
      )}
    </div>
  );
}
