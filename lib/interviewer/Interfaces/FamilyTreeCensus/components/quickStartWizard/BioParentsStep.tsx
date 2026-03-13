'use client';

import { useEffect, useRef, useState } from 'react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import {
  isGender,
  isSex,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/fieldOptions';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PersonFields';
import {
  type BioParentDetail,
  type ParentDetail,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { type Gender } from '~/lib/pedigree-layout/types';

export default function BioParentsStep() {
  return (
    <FormStoreProvider>
      <BioParentsForm />
    </FormStoreProvider>
  );
}

function BioParentsForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const parents = (data.parents as ParentDetail[] | undefined) ?? [];
  const bioParentCount = parents.filter((p) => p.biological !== false).length;
  const missingCount = Math.max(0, 2 - bioParentCount);

  const existing = data.bioParents as BioParentDetail[] | undefined;

  const [nameKnownState, setNameKnownState] = useState<boolean[]>(() =>
    Array.from(
      { length: missingCount },
      (_, i) => existing?.[i]?.nameKnown ?? false,
    ),
  );

  const nameKnownRef = useRef(nameKnownState);
  nameKnownRef.current = nameKnownState;

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const nameKnown = nameKnownRef.current;
      const bioParents: BioParentDetail[] = Array.from(
        { length: missingCount },
        (_, i) => {
          const rawName = values[`bioParent-${i}-name`];
          const rawSex = values[`bioParent-${i}-sex`];
          const rawGender = values[`bioParent-${i}-gender`];

          return {
            name: typeof rawName === 'string' ? rawName : '',
            sex:
              typeof rawSex === 'string' && isSex(rawSex) ? rawSex : undefined,
            gender: Array.isArray(rawGender)
              ? rawGender.filter(
                  (v): v is Gender => typeof v === 'string' && isGender(v),
                )
              : undefined,
            nameKnown: nameKnown[i] ?? false,
          };
        },
      );

      setStepData({ bioParents });
      return true;
    });
  }, [validateForm, getFormValues, setStepData, setBeforeNext, missingCount]);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <Paragraph>
        For the pedigree, we need information about biological parents.
        {bioParentCount > 0
          ? ` You identified ${bioParentCount} biological parent${bioParentCount === 1 ? '' : 's'} above.`
          : ''}{' '}
        Please tell us about the {missingCount === 1 ? 'other' : ''} biological
        parent{missingCount > 1 ? 's' : ''}.
      </Paragraph>
      {Array.from({ length: missingCount }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <Heading level="h3">
            Biological parent {bioParentCount + i + 1}
          </Heading>
          <UnconnectedField
            name={`bioParent-${i}-nameKnown`}
            label="Do you know this person's name?"
            component={ToggleField}
            value={nameKnownState[i] ?? false}
            onChange={(v) => {
              setNameKnownState((prev) =>
                prev.map((val, idx) => (idx === i ? (v ?? false) : val)),
              );
            }}
          />
          <PersonFields
            index={i}
            prefix="bioParent"
            initial={{
              name: existing?.[i]?.name,
              sex: existing?.[i]?.sex,
              gender: existing?.[i]?.gender,
            }}
            showName={nameKnownState[i] ?? false}
          />
        </div>
      ))}
    </div>
  );
}
