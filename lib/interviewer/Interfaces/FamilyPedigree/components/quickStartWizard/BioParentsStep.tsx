'use client';

import { useEffect, useRef, useState } from 'react';
import Surface from '~/components/layout/Surface';
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
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/fieldOptions';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import {
  type BioParentDetail,
  type ParentDetail,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

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

          return {
            name: typeof rawName === 'string' ? rawName : '',
            biologicalSex:
              typeof rawSex === 'string' && isSex(rawSex) ? rawSex : undefined,
            nameKnown: nameKnown[i] ?? false,
          };
        },
      );

      setStepData({ bioParents });
      return true;
    });
  }, [validateForm, getFormValues, setStepData, setBeforeNext, missingCount]);

  return (
    <>
      <Paragraph>
        For the purposes of this task, we need to ask you about your biological
        parents specifically, and not just your parents in general.
      </Paragraph>
      <Paragraph>
        {bioParentCount > 0
          ? ` You identified ${bioParentCount} biological parent${bioParentCount === 1 ? '' : 's'} previously.`
          : ''}{' '}
        Please tell us about your other biological parent
        {missingCount > 1 ? 's' : ''}.
      </Paragraph>
      <div className="flex flex-col gap-6">
        {Array.from({ length: missingCount }, (_, i) => (
          <Surface key={i} level={1} spacing="sm">
            <Heading level="h3">
              Biological parent {bioParentCount + i + 1}
            </Heading>
            <UnconnectedField
              inline
              name={`bioParent-${i}-nameKnown`}
              label="I know this person's name"
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
              }}
              showName={nameKnownState[i] ?? false}
            />
          </Surface>
        ))}
      </div>
    </>
  );
}
