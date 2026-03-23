'use client';

import { useEffect, useRef } from 'react';
import Heading from '~/components/typography/Heading';
import { useWizard } from '~/lib/dialogs/useWizard';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import {
  isGender,
  isSex,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/fieldOptions';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import { type PersonDetail } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

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
  const existing = data.siblings as PersonDetail[] | undefined;

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const siblings: PersonDetail[] = Array.from(
        { length: siblingCount },
        (_, i) => {
          const rawName = values[`sibling-${i}-name`];
          const rawSex = values[`sibling-${i}-sex`];

          return {
            name: typeof rawName === 'string' ? rawName : '',
            shape:
              typeof rawSex === 'string' && isSex(rawSex)
                ? rawSex === 'female'
                  ? ('circle' as const)
                  : rawSex === 'male'
                    ? ('square' as const)
                    : ('diamond' as const)
                : undefined,
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
        </div>
      ))}
    </div>
  );
}
