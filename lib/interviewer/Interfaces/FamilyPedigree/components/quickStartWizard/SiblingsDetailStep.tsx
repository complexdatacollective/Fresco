'use client';

import { useMemo } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Field from '~/lib/form/components/Field/Field';
import FieldGroup from '~/lib/form/components/FieldGroup';
import CheckboxGroupField from '~/lib/form/components/fields/CheckboxGroup';
import { useFormValue } from '~/lib/form/hooks/useFormValue';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

const MAX_PARENTS = 20;

const PARENT_NAME_FIELDS = Array.from(
  { length: MAX_PARENTS },
  (_, i) => `parent-${i}-name`,
);

export default function SiblingsDetailStep() {
  const { siblingCount: rawSiblingCount, parentCount: rawParentCount } =
    useFormValue(['siblingCount', 'parentCount']);
  const siblingCount = Number(rawSiblingCount ?? 0);
  const parentCount = Number(rawParentCount ?? 0);

  const parentNameValues = useFormValue(PARENT_NAME_FIELDS);

  const parentOptions = useMemo(
    () =>
      Array.from({ length: parentCount }, (_, i) => ({
        value: String(i),
        label:
          (parentNameValues[`parent-${i}-name`] as string | undefined) ??
          `Parent ${i + 1}`,
      })),
    [parentCount, parentNameValues],
  );

  const allParentIndices = useMemo(
    () => Array.from({ length: parentCount }, (_, i) => String(i)),
    [parentCount],
  );

  return (
    <div className="flex flex-col gap-6 pt-4">
      {Array.from({ length: siblingCount }, (_, i) => (
        <Surface key={i} level={1} spacing="sm">
          <Heading level="h3">Sibling {i + 1}</Heading>
          <PersonFields namespace={`sibling[${i}]`} />
          <FieldGroup
            watch={['parentCount']}
            condition={(values) => values.parentCount > 2}
          >
            <Field
              name={`sibling[${i}].sharedParents`}
              label="Which of your parents are also this sibling's parent?"
              data-testid="ego-parents-checkboxes"
              component={CheckboxGroupField}
              options={parentOptions}
              initialValue={allParentIndices}
              minSelected={2}
            />
          </FieldGroup>
        </Surface>
      ))}
    </div>
  );
}
