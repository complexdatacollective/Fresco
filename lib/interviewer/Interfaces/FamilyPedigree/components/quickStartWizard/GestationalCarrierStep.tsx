'use client';

import { useEffect, useRef } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import Field from '~/lib/form/components/Field/Field';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import { type ParentDetail } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

export default function GestationalCarrierStep() {
  return (
    <FormStoreProvider>
      <GestationalCarrierForm />
    </FormStoreProvider>
  );
}

const EDGE_TYPE_LABELS: Record<string, string> = {
  biological: 'Biological parent',
  social: 'Social parent',
  donor: 'Donor',
  surrogate: 'Surrogate',
};

function getParentLabel(parent: ParentDetail | undefined) {
  if (parent?.name) return parent.name;

  const role = EDGE_TYPE_LABELS[parent?.edgeType ?? ''] ?? 'Parent';

  return `${role} (assigned ${parent?.biologicalSex} at birth)`;
}

function GestationalCarrierForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const parents = (data.parents as ParentDetail[] | undefined) ?? [];
  const bioParents = data.bioParents as { name?: string }[] | undefined;
  const allParents = [...parents, ...(bioParents ?? [])];

  const existingIndex = data.gestationalCarrierParentIndex as
    | number
    | undefined;
  const initialValue =
    existingIndex !== undefined ? String(existingIndex) : undefined;

  const options = [
    ...allParents.map((parent, i) => ({
      value: String(i),
      label: getParentLabel(parent as ParentDetail | undefined),
    })),
    { value: 'none', label: 'None / Unknown' },
  ];

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const rawValue = values.gestationalCarrier;
      const gestationalCarrierParentIndex =
        rawValue !== undefined && rawValue !== 'none'
          ? Number(rawValue)
          : undefined;

      setStepData({ gestationalCarrierParentIndex });
      return true;
    });
  }, [validateForm, getFormValues, setStepData, setBeforeNext]);

  return (
    <Field
      name="gestationalCarrier"
      label="Which parent carried the pregnancy?"
      component={RadioGroupField}
      options={options}
      initialValue={initialValue}
    />
  );
}
