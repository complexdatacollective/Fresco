'use client';

import { useCallback, useMemo } from 'react';
import Field from '~/lib/form/components/Field/Field';
import FieldGroup from '~/lib/form/components/FieldGroup';
import BooleanField from '~/lib/form/components/fields/Boolean';
import InputField from '~/lib/form/components/fields/InputField';
import { useFormValue } from '~/lib/form/hooks/useFormValue';

const MAX_SIBLINGS = 20;

const SIBLING_NAME_FIELDS = Array.from(
  { length: MAX_SIBLINGS },
  (_, i) => `sibling-${i}-name`,
);

export default function SiblingFamilyCountStep() {
  const { siblingCount: rawSiblingCount } = useFormValue(['siblingCount']);
  const siblingCount = Number(rawSiblingCount ?? 0);
  const siblingNameValues = useFormValue(SIBLING_NAME_FIELDS);

  if (siblingCount === 0) {
    return (
      <div className="pt-4">
        <p className="text-muted-foreground text-sm">No siblings to detail.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      {Array.from({ length: siblingCount }, (_, i) => {
        const siblingName =
          (siblingNameValues[`sibling-${i}-name`] as string | undefined) ??
          `Sibling ${i + 1}`;

        return (
          <SiblingFamilyEntry key={i} index={i} siblingName={siblingName} />
        );
      })}
    </div>
  );
}

function SiblingFamilyEntry({
  index,
  siblingName,
}: {
  index: number;
  siblingName: string;
}) {
  const hasChildrenFieldName = `sibling-${index}-hasChildren`;

  const hasChildrenCondition = useCallback(
    (values: Record<string, unknown>) => values[hasChildrenFieldName] === true,
    [hasChildrenFieldName],
  );

  const watchFields = useMemo(
    () => [hasChildrenFieldName],
    [hasChildrenFieldName],
  );

  return (
    <div className="flex flex-col gap-3">
      <Field
        name={hasChildrenFieldName}
        label={`Does ${siblingName} have children?`}
        component={BooleanField}
      />
      <FieldGroup watch={watchFields} condition={hasChildrenCondition}>
        <Field
          name={`sibling-${index}-childCount`}
          inline
          label="How many?"
          component={InputField}
          type="number"
          initialValue="1"
          min={1}
          max={20}
        />
        <Field
          name={`sibling-${index}-hasPartner`}
          label={`Does ${siblingName} have a partner?`}
          component={BooleanField}
        />
      </FieldGroup>
    </div>
  );
}
