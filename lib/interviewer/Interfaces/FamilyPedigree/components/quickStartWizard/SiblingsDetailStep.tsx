'use client';

import { useEffect, useRef } from 'react';
import Heading from '~/components/typography/Heading';
import { useWizard } from '~/lib/dialogs/useWizard';
import Field from '~/lib/form/components/Field/Field';
import CheckboxGroupField from '~/lib/form/components/fields/CheckboxGroup';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import {
  type ParentDetail,
  type SiblingDetail,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

export default function SiblingsDetailStep() {
  return (
    <FormStoreProvider>
      <SiblingsDetailForm />
    </FormStoreProvider>
  );
}

function SiblingsDetailForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const siblingCount = (data.siblingCount as number | undefined) ?? 0;
  const existing = data.siblings as SiblingDetail[] | undefined;
  const parents = (data.parents as ParentDetail[] | undefined) ?? [];

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const siblings: SiblingDetail[] = Array.from(
        { length: siblingCount },
        (_, i) => {
          const rawName = values[`sibling-${i}-name`];
          const rawSex = values[`sibling-${i}-sex`];
          const rawSharedParents = values[`sibling-${i}-sharedParents`];
          const sharedParentIndices = Array.isArray(rawSharedParents)
            ? rawSharedParents.map((v) => Number(v))
            : [];

          return {
            name: typeof rawName === 'string' ? rawName : '',
            biologicalSex: typeof rawSex === 'string' ? rawSex : undefined,
            sharedParentIndices,
          };
        },
      );

      setStepData({ siblings });
      return true;
    });
  }, [validateForm, getFormValues, setStepData, setBeforeNext, siblingCount]);

  return (
    <div className="flex flex-col gap-6 pt-4">
      {Array.from({ length: siblingCount }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded border p-4">
          <Heading level="h3">Sibling {i + 1}</Heading>
          <PersonFields
            index={i}
            prefix="sibling"
            initial={{
              name: existing?.[i]?.name,
            }}
          />
          {parents.length > 0 && (
            <Field
              name={`sibling-${i}-sharedParents`}
              label={`Which of your parents are also ${existing?.[i]?.name || 'this sibling'}'s parent?`}
              component={CheckboxGroupField}
              options={parents.map((p, pIdx) => ({
                value: String(pIdx),
                label: p.name || `Parent ${pIdx + 1}`,
              }))}
              initialValue={
                existing?.[i]?.sharedParentIndices
                  ? existing[i].sharedParentIndices.map((idx) => String(idx))
                  : parents.map((_, pIdx) => String(pIdx))
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}
