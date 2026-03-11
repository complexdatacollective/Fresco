'use client';

import { useEffect, useRef } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import {
  isGender,
  isSex,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/fieldOptions';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PersonFields';
import { type PersonDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { type Gender } from '~/lib/pedigree-layout/types';

export default function OtherChildrenDetailStep() {
  return (
    <FormStoreProvider>
      <OtherChildrenDetailForm />
    </FormStoreProvider>
  );
}

function OtherChildrenDetailForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const childCount = (data.otherChildrenCount as number | undefined) ?? 0;
  const existing = data.otherChildren as PersonDetail[] | undefined;

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const otherChildren: PersonDetail[] = Array.from(
        { length: childCount },
        (_, i) => {
          const rawName = values[`otherChild-${i}-name`];
          const rawSex = values[`otherChild-${i}-sex`];
          const rawGender = values[`otherChild-${i}-gender`];

          return {
            name: typeof rawName === 'string' ? rawName : '',
            sex:
              typeof rawSex === 'string' && isSex(rawSex) ? rawSex : undefined,
            gender: Array.isArray(rawGender)
              ? rawGender.filter(
                  (v): v is Gender => typeof v === 'string' && isGender(v),
                )
              : undefined,
          };
        },
      );

      setStepData({ otherChildren });
      return true;
    });
  }, [validateForm, getFormValues, setStepData, setBeforeNext, childCount]);

  return (
    <div className="flex flex-col gap-6 pt-4">
      {Array.from({ length: childCount }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">Child {i + 1}</h3>
          <PersonFields
            index={i}
            prefix="otherChild"
            initial={{
              name: existing?.[i]?.name,
              sex: existing?.[i]?.sex,
              gender: existing?.[i]?.gender,
            }}
          />
        </div>
      ))}
    </div>
  );
}
