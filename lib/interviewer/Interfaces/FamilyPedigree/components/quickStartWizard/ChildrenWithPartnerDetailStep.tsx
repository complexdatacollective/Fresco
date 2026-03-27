'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { useWizard } from '~/lib/dialogs/useWizard';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import { extractFormFieldAttributes } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/extractFormFieldAttributes';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import { type PersonDetail } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getNodeForm } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function ChildrenWithPartnerDetailStep() {
  return (
    <FormStoreProvider>
      <ChildrenWithPartnerDetailForm />
    </FormStoreProvider>
  );
}

function ChildrenWithPartnerDetailForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const rawFormFields = useSelector(getNodeForm);
  const formFields = useMemo(() => rawFormFields ?? [], [rawFormFields]);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const childCount = (data.childrenWithPartnerCount as number | undefined) ?? 0;
  const existing = data.childrenWithPartner as PersonDetail[] | undefined;

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const childrenWithPartner: PersonDetail[] = Array.from(
        { length: childCount },
        (_, i) => {
          const rawName = values[`childWithPartner-${i}-name`];
          const rawSex = values[`childWithPartner-${i}-sex`];

          return {
            name: typeof rawName === 'string' ? rawName : '',
            biologicalSex: typeof rawSex === 'string' ? rawSex : undefined,
            attributes: extractFormFieldAttributes(
              values,
              `childWithPartner-${i}`,
              formFields,
            ),
          };
        },
      );

      setStepData({ childrenWithPartner });
      return true;
    });
  }, [
    validateForm,
    getFormValues,
    setStepData,
    setBeforeNext,
    childCount,
    formFields,
  ]);

  return (
    <div className="flex flex-col gap-6 pt-4">
      {Array.from({ length: childCount }, (_, i) => (
        <Surface key={i} level={1} spacing="sm">
          <Heading level="h3">Child {i + 1}</Heading>
          <PersonFields
            nameToggle={false}
            namespace={`childWithPartner-${i}`}
            initial={{
              name: existing?.[i]?.name,
              sex: existing?.[i]?.biologicalSex,
              attributes: existing?.[i]?.attributes,
            }}
          />
        </Surface>
      ))}
    </div>
  );
}
