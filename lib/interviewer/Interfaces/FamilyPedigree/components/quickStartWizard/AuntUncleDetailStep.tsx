'use client';

import { useCallback, useMemo } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Field from '~/lib/form/components/Field/Field';
import FieldGroup from '~/lib/form/components/FieldGroup';
import BooleanField from '~/lib/form/components/fields/Boolean';
import InputField from '~/lib/form/components/fields/InputField';
import useFormStore from '~/lib/form/hooks/useFormStore';
import { useFormValue } from '~/lib/form/hooks/useFormValue';
import {
  getAllParents,
  getParentDisplayName,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/getAllParents';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

const MAX_PARENTS = 20;

const AUNT_UNCLE_COUNT_FIELDS = Array.from(
  { length: MAX_PARENTS },
  (_, i) => `auntUncleCount-${i}`,
);

export default function AuntUncleDetailStep() {
  const getFieldState = useFormStore((s) => s.getFieldState);
  const allParents = useMemo(
    () => getAllParents((name) => getFieldState(name)?.value),
    [getFieldState],
  );

  const auntUncleCountValues = useFormValue(AUNT_UNCLE_COUNT_FIELDS);

  const branchesWithAuntsUncles = allParents
    .map((entry, parentIdx) => {
      const count = Number(
        auntUncleCountValues[`auntUncleCount-${parentIdx}`] ?? 0,
      );
      return { entry, parentIdx, count };
    })
    .filter(({ count }) => count > 0);

  if (branchesWithAuntsUncles.length === 0) {
    return (
      <div className="pt-4">
        <p className="text-muted-foreground text-sm">
          No aunts or uncles to detail.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      {branchesWithAuntsUncles.map(({ entry, parentIdx, count }) => {
        const parentName = getParentDisplayName(entry, parentIdx);

        return (
          <Surface key={parentIdx} level={1} spacing="sm">
            <Heading level="h3">{parentName}&apos;s siblings</Heading>
            {Array.from({ length: count }, (_, auIdx) => (
              <AuntUncleEntry
                key={auIdx}
                parentIdx={parentIdx}
                auIdx={auIdx}
                parentName={parentName}
              />
            ))}
          </Surface>
        );
      })}
    </div>
  );
}

function AuntUncleEntry({
  parentIdx,
  auIdx,
  parentName,
}: {
  parentIdx: number;
  auIdx: number;
  parentName: string;
}) {
  const nameFieldKey = `auntUncle-${parentIdx}-${auIdx}-name`;
  const hasChildrenFieldName = `auntUncle-${parentIdx}-${auIdx}-hasChildren`;

  const nameFields = useMemo(() => [nameFieldKey], [nameFieldKey]);
  const nameValues = useFormValue(nameFields);
  const currentName =
    (nameValues[nameFieldKey] as string | undefined) ??
    `Aunt/Uncle ${auIdx + 1}`;

  const hasChildrenCondition = useCallback(
    (values: Record<string, unknown>) => values[hasChildrenFieldName] === true,
    [hasChildrenFieldName],
  );

  const watchFields = useMemo(
    () => [hasChildrenFieldName],
    [hasChildrenFieldName],
  );

  return (
    <Surface level={2} spacing="sm">
      <Heading level="h4">
        {parentName}&apos;s sibling {auIdx + 1}
      </Heading>
      <PersonFields
        nameToggle={false}
        namespace={`auntUncle-${parentIdx}-${auIdx}`}
      />
      <Field
        name={hasChildrenFieldName}
        label={`Does ${currentName} have children?`}
        component={BooleanField}
      />
      <FieldGroup watch={watchFields} condition={hasChildrenCondition}>
        <Field
          name={`auntUncle-${parentIdx}-${auIdx}-childCount`}
          inline
          label="How many children?"
          component={InputField}
          type="number"
          initialValue="1"
          min={1}
          max={20}
        />
        <Field
          name={`auntUncle-${parentIdx}-${auIdx}-hasPartner`}
          label={`Does ${currentName} have a partner?`}
          component={BooleanField}
        />
      </FieldGroup>
    </Surface>
  );
}
