'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { useWizard } from '~/lib/dialogs/useWizard';
import Field from '~/lib/form/components/Field/Field';
import RichSelectGroupField from '~/lib/form/components/fields/RichSelectGroup';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import { extractFormFieldAttributes } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/extractFormFieldAttributes';
import {
  isBiologicalEdgeType,
  PARENT_EDGE_TYPE_OPTIONS,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/fieldOptions';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import { type ParentDetail } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getNodeForm } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function ParentsDetailStep() {
  return (
    <FormStoreProvider>
      <ParentsDetailForm />
    </FormStoreProvider>
  );
}

function ParentsDetailForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const rawFormFields = useSelector(getNodeForm);
  const formFields = useMemo(() => rawFormFields ?? [], [rawFormFields]);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const parentCount = (data.parentCount as number | undefined) ?? 0;
  const existing = data.parents as ParentDetail[] | undefined;

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const parents: ParentDetail[] = Array.from(
        { length: parentCount },
        (_, i) => {
          const rawName = values[`parent-${i}-name`];
          const rawSex = values[`parent-${i}-sex`];
          const rawEdgeType = values[`parent-${i}-edgeType`];

          const edgeType =
            typeof rawEdgeType === 'string'
              ? (rawEdgeType as ParentDetail['edgeType'])
              : 'biological';

          return {
            name: typeof rawName === 'string' ? rawName : '',
            biologicalSex: typeof rawSex === 'string' ? rawSex : undefined,
            attributes: extractFormFieldAttributes(
              values,
              `parent-${i}`,
              formFields,
            ),
            nameKnown: Boolean(values[`parent-${i}-nameKnown`]),
            biological: isBiologicalEdgeType(edgeType),
            edgeType,
          };
        },
      );

      setStepData({ parents });
      return true;
    });
  }, [
    validateForm,
    getFormValues,
    setStepData,
    setBeforeNext,
    parentCount,
    formFields,
  ]);

  return (
    <div className="mt-6 flex flex-col gap-6">
      {Array.from({ length: parentCount }, (_, i) => {
        return (
          <Surface key={i} level={1} spacing="sm">
            <Heading level="h3">Parent {i + 1}</Heading>
            <PersonFields
              namespace={`parent-${i}`}
              initial={{
                name: existing?.[i]?.name,
                sex: existing?.[i]?.biologicalSex,
                attributes: existing?.[i]?.attributes,
              }}
            />
            <Field
              name={`parent-${i}-edgeType`}
              label="Relationship type"
              component={RichSelectGroupField}
              options={PARENT_EDGE_TYPE_OPTIONS}
              initialValue={existing?.[i]?.edgeType ?? 'biological'}
              required
            />
          </Surface>
        );
      })}
    </div>
  );
}
