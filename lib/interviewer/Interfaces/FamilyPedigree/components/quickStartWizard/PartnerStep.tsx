'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import InputField from '~/lib/form/components/fields/InputField';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import { extractFormFieldAttributes } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/extractFormFieldAttributes';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import { getNodeForm } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function PartnerStep() {
  return (
    <FormStoreProvider>
      <PartnerForm />
    </FormStoreProvider>
  );
}

function PartnerForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const rawFormFields = useSelector(getNodeForm);
  const formFields = useMemo(() => rawFormFields ?? [], [rawFormFields]);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const existingName = (data.partnerName as string | undefined) ?? '';
  const existingSex = (data.partnerSex as string | undefined) ?? undefined;

  const [childrenWithPartnerCount, setChildrenWithPartnerCount] = useState(
    (data.childrenWithPartnerCount as number | undefined) ?? 0,
  );

  const childrenCountRef = useRef(childrenWithPartnerCount);
  childrenCountRef.current = childrenWithPartnerCount;

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const rawName = values['partner-0-name'];
      const rawSex = values['partner-0-sex'];

      setStepData({
        partnerName: typeof rawName === 'string' ? rawName : '',
        partnerSex: typeof rawSex === 'string' ? rawSex : undefined,
        partnerAttributes: extractFormFieldAttributes(
          values,
          'partner-0',
          formFields,
        ),
        childrenWithPartnerCount: childrenCountRef.current,
      });
      return true;
    });
  }, [validateForm, getFormValues, setStepData, setBeforeNext, formFields]);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <PersonFields
        nameToggle={false}
        namespace="partner-0"
        initial={{
          name: existingName,
          sex: existingSex,
          attributes: data.partnerAttributes as
            | Record<string, unknown>
            | undefined,
        }}
      />
      <UnconnectedField
        name="childrenWithPartnerCount"
        inline
        label="How many children do you have with your partner?"
        component={InputField}
        type="number"
        value={String(childrenWithPartnerCount)}
        min={0}
        max={20}
        onChange={(v) => {
          setChildrenWithPartnerCount(Number(v) || 0);
        }}
      />
    </div>
  );
}
