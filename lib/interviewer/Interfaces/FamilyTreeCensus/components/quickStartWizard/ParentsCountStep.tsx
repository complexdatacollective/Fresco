'use client';

import { useEffect, useRef, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import Field from '~/lib/form/components/Field/Field';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import BooleanField from '~/lib/form/components/fields/Boolean';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';

export default function ParentsCountStep() {
  return (
    <FormStoreProvider>
      <ParentsCountForm />
    </FormStoreProvider>
  );
}

function ParentsCountForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const [parentCount, setParentCount] = useState(
    (data.parentCount as number | undefined) ?? 2,
  );
  const [siblingCount, setSiblingCount] = useState(
    (data.siblingCount as number | undefined) ?? 0,
  );

  const existingHasPartner =
    (data.hasPartner as boolean | undefined) ?? undefined;

  const parentCountRef = useRef(parentCount);
  parentCountRef.current = parentCount;
  const siblingCountRef = useRef(siblingCount);
  siblingCountRef.current = siblingCount;

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const rawHasPartner = values.hasPartner;

      setStepData({
        parentCount: parentCountRef.current,
        siblingCount: siblingCountRef.current,
        hasPartner:
          typeof rawHasPartner === 'boolean' ? rawHasPartner : undefined,
      });
      return true;
    });
  }, [validateForm, getFormValues, setStepData, setBeforeNext]);

  return (
    <>
      <UnconnectedField
        name="parentCount"
        inline
        label="How many parents do you have?"
        hint="This includes biological parents, donors/surrogates, step/adoptive parents, and anyone else that you consider a parent."
        component={NumberCounterField}
        value={parentCount}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setParentCount(newCount);
        }}
      />
      <UnconnectedField
        name="siblingCount"
        inline
        label="How many siblings do you have?"
        component={NumberCounterField}
        value={siblingCount}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setSiblingCount(newCount);
        }}
      />
      <Field
        name="hasPartner"
        inline
        label="Do you have a partner?"
        hint="This includes anyone you are currently in a romantic relationship with, including dating, committed, married, etc."
        component={BooleanField}
        initialValue={existingHasPartner}
        required
      />
    </>
  );
}
