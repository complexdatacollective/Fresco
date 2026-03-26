'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import { extractFormFieldAttributes } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/extractFormFieldAttributes';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import {
  type HalfSiblingOtherParent,
  type ParentDetail,
  type SiblingDetail,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getNodeForm } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function HalfSiblingParentsStep() {
  return (
    <FormStoreProvider>
      <HalfSiblingParentsForm />
    </FormStoreProvider>
  );
}

type HalfSiblingEntry = {
  siblingIndex: number;
  sibling: SiblingDetail;
};

function HalfSiblingParentsForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const rawFormFields = useSelector(getNodeForm);
  const formFields = useMemo(() => rawFormFields ?? [], [rawFormFields]);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const siblings = (data.siblings as SiblingDetail[] | undefined) ?? [];
  const parents = (data.parents as ParentDetail[] | undefined) ?? [];
  const egoParentIndices: number[] =
    (data.egoParentIndices as number[] | undefined) ?? parents.map((_, i) => i);
  const egoParentSet = new Set(egoParentIndices);

  const halfSiblings = useMemo<HalfSiblingEntry[]>(() => {
    return siblings.flatMap((sibling, siblingIndex) => {
      const sharedSet = new Set(sibling.sharedParentIndices);
      const isStrictSubset =
        sharedSet.size < egoParentSet.size &&
        [...sharedSet].every((idx) => egoParentSet.has(idx));
      if (!isStrictSubset) return [];
      return [{ siblingIndex, sibling }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siblings, egoParentIndices]);

  const existing =
    (data.halfSiblingOtherParents as HalfSiblingOtherParent[] | undefined) ??
    [];

  const findExisting = (sibIdx: number): HalfSiblingOtherParent | undefined =>
    existing.find((e) => e.siblingIndex === sibIdx);

  const [nameKnownState, setNameKnownState] = useState<Record<number, boolean>>(
    () => {
      const initial: Record<number, boolean> = {};
      for (const { siblingIndex } of halfSiblings) {
        initial[siblingIndex] = findExisting(siblingIndex)?.nameKnown ?? true;
      }
      return initial;
    },
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

      const halfSiblingOtherParents: HalfSiblingOtherParent[] =
        halfSiblings.map(({ siblingIndex, sibling }) => {
          const rawName = values[`halfSibParent-${siblingIndex}-name`];
          const rawSex = values[`halfSibParent-${siblingIndex}-sex`];

          return {
            name: typeof rawName === 'string' ? rawName : '',
            biologicalSex: typeof rawSex === 'string' ? rawSex : undefined,
            attributes: extractFormFieldAttributes(
              values,
              'halfSibParent',
              siblingIndex,
              formFields,
            ),
            nameKnown: nameKnown[siblingIndex] ?? true,
            siblingIndex,
            sharedParentIndices: sibling.sharedParentIndices,
          };
        });

      setStepData({ halfSiblingOtherParents });
      return true;
    });
  }, [
    validateForm,
    getFormValues,
    setStepData,
    setBeforeNext,
    halfSiblings,
    formFields,
  ]);

  if (halfSiblings.length === 0) {
    return (
      <Paragraph>
        No half-siblings were identified, so there are no other parents to
        collect.
      </Paragraph>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {halfSiblings.map(({ siblingIndex, sibling }) => {
        const siblingName = sibling.name || `Sibling ${siblingIndex + 1}`;
        const nameKnown = nameKnownState[siblingIndex] ?? true;
        const existingEntry = findExisting(siblingIndex);

        return (
          <Surface key={siblingIndex} level={1} spacing="sm">
            <Heading level="h3">{siblingName}&apos;s other parent</Heading>
            <Paragraph>
              You mentioned that {siblingName} doesn&apos;t share all your
              parents.
            </Paragraph>
            <UnconnectedField
              inline
              name={`halfSibParent-${siblingIndex}-nameKnown`}
              label="I know this person's name"
              component={ToggleField}
              value={nameKnown}
              onChange={(v) => {
                setNameKnownState((prev) => ({
                  ...prev,
                  [siblingIndex]: v ?? true,
                }));
              }}
            />
            <PersonFields
              index={siblingIndex}
              prefix="halfSibParent"
              initial={{
                name: existingEntry?.name,
                sex: existingEntry?.biologicalSex,
              }}
              showName={nameKnown}
            />
          </Surface>
        );
      })}
    </div>
  );
}
