'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import { extractFormFieldAttributes } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/extractFormFieldAttributes';
import {
  getAllParents,
  getParentDisplayName,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/getAllParents';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import {
  type GrandparentDetail,
  type ParentBranch,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getNodeForm } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function GrandparentsStep() {
  return (
    <FormStoreProvider>
      <GrandparentsForm />
    </FormStoreProvider>
  );
}

type GrandparentMeta = {
  nameKnown: boolean;
};

function GrandparentsForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const rawFormFields = useSelector(getNodeForm);
  const formFields = useMemo(() => rawFormFields ?? [], [rawFormFields]);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const allParents = useMemo(() => getAllParents(data), [data]);
  const existingBranches = data.parentBranches as ParentBranch[] | undefined;

  const findExistingGp = (
    parentIdx: number,
    gpIdx: 0 | 1,
  ): GrandparentDetail | undefined =>
    existingBranches?.find((b) => b.parentIndex === parentIdx)?.grandparents[
      gpIdx
    ];

  const [gpMeta, setGpMeta] = useState<GrandparentMeta[][]>(() =>
    allParents.map((_, parentIdx) =>
      [0, 1].map((gpIdx) => ({
        nameKnown: findExistingGp(parentIdx, gpIdx as 0 | 1)?.nameKnown ?? true,
      })),
    ),
  );

  const gpMetaRef = useRef(gpMeta);
  gpMetaRef.current = gpMeta;

  const updateGpMeta = (
    parentIdx: number,
    gpIdx: number,
    updates: Partial<GrandparentMeta>,
  ) => {
    setGpMeta((prev) =>
      prev.map((parentRow, pi) =>
        pi === parentIdx
          ? parentRow.map((gp, gi) =>
              gi === gpIdx ? { ...gp, ...updates } : gp,
            )
          : parentRow,
      ),
    );
  };

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const meta = gpMetaRef.current;

      const parentBranches: ParentBranch[] = allParents
        .filter((_, parentIdx) => parentIdx < allParents.length)
        .map((_, parentIdx) => {
          const grandparents: [GrandparentDetail, GrandparentDetail] = [
            0, 1,
          ].map((gpIdx) => {
            const rawName = values[`grandparent-${parentIdx}-${gpIdx}-name`];
            const rawSex = values[`grandparent-${parentIdx}-${gpIdx}-sex`];
            const nameKnown = meta[parentIdx]?.[gpIdx]?.nameKnown ?? true;

            return {
              name: typeof rawName === 'string' ? rawName : '',
              biologicalSex: typeof rawSex === 'string' ? rawSex : undefined,
              attributes: extractFormFieldAttributes(
                values,
                `grandparent-${parentIdx}`,
                gpIdx,
                formFields,
              ),
              nameKnown,
            };
          }) as [GrandparentDetail, GrandparentDetail];

          return {
            parentIndex: parentIdx,
            grandparents,
            auntUncleCount: 0,
            auntsUncles: [],
          };
        });

      setStepData({ parentBranches });
      return true;
    });
  }, [
    validateForm,
    getFormValues,
    setStepData,
    setBeforeNext,
    allParents,
    formFields,
  ]);

  return (
    <div className="mt-6 flex flex-col gap-6">
      {allParents.map((entry, parentIdx) => {
        const parentName = getParentDisplayName(entry, parentIdx);

        return (
          <Surface key={parentIdx} level={1} spacing="sm">
            <Heading level="h3">{parentName}&apos;s parents</Heading>
            {([0, 1] as const).map((gpIdx) => {
              const existingGp = findExistingGp(parentIdx, gpIdx);
              const nameKnown = gpMeta[parentIdx]?.[gpIdx]?.nameKnown ?? true;

              return (
                <Surface key={gpIdx} level={2} spacing="sm">
                  <Heading level="h4">Grandparent {gpIdx + 1}</Heading>
                  <UnconnectedField
                    inline
                    name={`grandparent-${parentIdx}-${gpIdx}-nameKnown`}
                    label="I know this person's name"
                    component={ToggleField}
                    value={nameKnown}
                    onChange={(v) => {
                      updateGpMeta(parentIdx, gpIdx, { nameKnown: v ?? true });
                    }}
                  />
                  <PersonFields
                    index={gpIdx}
                    prefix={`grandparent-${parentIdx}`}
                    initial={{
                      name: existingGp?.name,
                      sex: existingGp?.biologicalSex,
                    }}
                    showName={nameKnown}
                  />
                </Surface>
              );
            })}
          </Surface>
        );
      })}
    </div>
  );
}
