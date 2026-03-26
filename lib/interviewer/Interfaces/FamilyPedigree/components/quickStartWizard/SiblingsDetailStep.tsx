'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { useWizard } from '~/lib/dialogs/useWizard';
import Field from '~/lib/form/components/Field/Field';
import CheckboxGroupField from '~/lib/form/components/fields/CheckboxGroup';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import { extractFormFieldAttributes } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/extractFormFieldAttributes';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import {
  type ParentDetail,
  type SiblingDetail,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getNodeForm } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

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
  const rawFormFields = useSelector(getNodeForm);
  const formFields = useMemo(() => rawFormFields ?? [], [rawFormFields]);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const siblingCount = (data.siblingCount as number | undefined) ?? 0;
  const existing = data.siblings as SiblingDetail[] | undefined;
  const parents = useMemo(
    () => (data.parents as ParentDetail[] | undefined) ?? [],
    [data.parents],
  );

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();

      // Ego's parent indices (only relevant when 3+ parents)
      const rawEgoParents = values['ego-parents'];
      const egoParentIndices = Array.isArray(rawEgoParents)
        ? rawEgoParents.map((v) => Number(v))
        : parents.map((_, idx) => idx);

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
            attributes: extractFormFieldAttributes(
              values,
              'sibling',
              i,
              formFields,
            ),
            sharedParentIndices,
          };
        },
      );

      setStepData({
        siblings,
        ...(parents.length >= 3 ? { egoParentIndices } : {}),
      });
      return true;
    });
  }, [
    validateForm,
    getFormValues,
    setStepData,
    setBeforeNext,
    siblingCount,
    parents,
    formFields,
  ]);

  const existingEgoParents = data.egoParentIndices as number[] | undefined;

  const parentOptions = useMemo(
    () =>
      parents.map((p, pIdx) => ({
        value: String(pIdx),
        label: p.name ?? `Parent ${pIdx + 1}`,
      })),
    [parents],
  );

  const allParentIndices = useMemo(
    () => parents.map((_, pIdx) => String(pIdx)),
    [parents],
  );

  const egoParentsInitial = useMemo(
    () =>
      existingEgoParents
        ? existingEgoParents.map((idx) => String(idx))
        : allParentIndices,
    [existingEgoParents, allParentIndices],
  );

  return (
    <div className="flex flex-col gap-6 pt-4">
      {parents.length >= 3 && (
        <Surface level={1} spacing="sm">
          <Paragraph>
            Since you have multiple parents, please confirm which are
            specifically your parents (not just your siblings&apos; parents).
          </Paragraph>
          <Field
            name="ego-parents"
            label="Which of these parents are YOUR parents?"
            data-testid="ego-parents-checkboxes"
            component={CheckboxGroupField}
            options={parentOptions}
            initialValue={egoParentsInitial}
          />
        </Surface>
      )}
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
              label={`Which of your parents are also ${existing?.[i]?.name ?? 'this sibling'}'s parent?`}
              component={CheckboxGroupField}
              options={parentOptions}
              initialValue={
                existing?.[i]?.sharedParentIndices
                  ? existing[i].sharedParentIndices.map((idx) => String(idx))
                  : allParentIndices
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}
