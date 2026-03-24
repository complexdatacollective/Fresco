'use client';

import { useEffect, useRef } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import Field from '~/lib/form/components/Field/Field';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import { type AdoptionStatus } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const adoptionOptions = [
  { value: 'none', label: 'No' },
  { value: 'in', label: 'Yes, I was adopted into my family' },
  { value: 'out', label: 'Yes, I was adopted out of my birth family' },
  { value: 'by-relative', label: 'Yes, I was adopted by a relative' },
];

export default function AdoptionStatusStep() {
  return (
    <FormStoreProvider>
      <AdoptionStatusForm />
    </FormStoreProvider>
  );
}

function AdoptionStatusForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const existing = data.adoptionStatus as AdoptionStatus | undefined;
  const initialValue = existing ?? undefined;

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const rawValue = values.adoptionStatus;
      const adoptionStatus: AdoptionStatus | undefined =
        rawValue === 'in' || rawValue === 'out' || rawValue === 'by-relative'
          ? rawValue
          : undefined;

      setStepData({ adoptionStatus });
      return true;
    });
  }, [validateForm, getFormValues, setStepData, setBeforeNext]);

  return (
    <Field
      name="adoptionStatus"
      label="Were you adopted?"
      component={RadioGroupField}
      options={adoptionOptions}
      initialValue={initialValue ?? 'none'}
      required
    />
  );
}
