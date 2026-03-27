'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import BooleanField from '~/lib/form/components/fields/Boolean';
import InputField from '~/lib/form/components/fields/InputField';
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
  type AuntUncleDetail,
  type ParentBranch,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getNodeForm } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function AuntUncleDetailStep() {
  return (
    <FormStoreProvider>
      <AuntUncleDetailForm />
    </FormStoreProvider>
  );
}

function AuntUncleDetailForm() {
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

  const [hasChildrenMap, setHasChildrenMap] = useState<
    Record<string, boolean | undefined>
  >(() => {
    const initial: Record<string, boolean | undefined> = {};
    allParents.forEach((_, parentIdx) => {
      const branch = existingBranches?.find((b) => b.parentIndex === parentIdx);
      const count = branch?.auntUncleCount ?? 0;
      for (let auIdx = 0; auIdx < count; auIdx++) {
        const existing = branch?.auntsUncles[auIdx];
        initial[`${parentIdx}-${auIdx}`] = existing?.hasChildren;
      }
    });
    return initial;
  });

  const [hasPartnerMap, setHasPartnerMap] = useState<
    Record<string, boolean | undefined>
  >(() => {
    const initial: Record<string, boolean | undefined> = {};
    allParents.forEach((_, parentIdx) => {
      const branch = existingBranches?.find((b) => b.parentIndex === parentIdx);
      const count = branch?.auntUncleCount ?? 0;
      for (let auIdx = 0; auIdx < count; auIdx++) {
        const existing = branch?.auntsUncles[auIdx];
        initial[`${parentIdx}-${auIdx}`] =
          existing?.hasChildren === true ? existing.hasPartner : undefined;
      }
    });
    return initial;
  });

  const [childCounts, setChildCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    allParents.forEach((_, parentIdx) => {
      const branch = existingBranches?.find((b) => b.parentIndex === parentIdx);
      const count = branch?.auntUncleCount ?? 0;
      for (let auIdx = 0; auIdx < count; auIdx++) {
        const existing = branch?.auntsUncles[auIdx];
        const existingChildCount =
          existing?.hasChildren === true ? existing.children.length : 0;
        initial[`${parentIdx}-${auIdx}`] = existingChildCount;
      }
    });
    return initial;
  });

  const hasChildrenMapRef = useRef(hasChildrenMap);
  hasChildrenMapRef.current = hasChildrenMap;

  const hasPartnerMapRef = useRef(hasPartnerMap);
  hasPartnerMapRef.current = hasPartnerMap;

  const childCountsRef = useRef(childCounts);
  childCountsRef.current = childCounts;

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const currentHasChildren = hasChildrenMapRef.current;
      const currentHasPartner = hasPartnerMapRef.current;
      const currentChildCounts = childCountsRef.current;

      const parentBranches: ParentBranch[] = allParents.map((_, parentIdx) => {
        const existing = existingBranches?.find(
          (b) => b.parentIndex === parentIdx,
        );
        const count = existing?.auntUncleCount ?? 0;

        const auntsUncles: AuntUncleDetail[] = Array.from(
          { length: count },
          (_, auIdx) => {
            const key = `${parentIdx}-${auIdx}`;
            const rawName = values[`auntUncle-${parentIdx}-${auIdx}-name`];
            const rawSex = values[`auntUncle-${parentIdx}-${auIdx}-sex`];
            const hasChildren = currentHasChildren[key] ?? false;

            const personBase = {
              name: typeof rawName === 'string' ? rawName : '',
              biologicalSex: typeof rawSex === 'string' ? rawSex : undefined,
              attributes: extractFormFieldAttributes(
                values,
                `auntUncle-${parentIdx}-${auIdx}`,
                formFields,
              ),
            };

            if (!hasChildren) {
              return { ...personBase, hasChildren: false, children: [] as [] };
            }

            const hasPartner = currentHasPartner[key] ?? false;

            return {
              ...personBase,
              hasChildren: true,
              hasPartner,
              partner: undefined,
              children: [],
            };
          },
        );

        const auntUncleChildCounts = Object.fromEntries(
          Array.from({ length: count }, (_, auIdx) => [
            `${parentIdx}-${auIdx}`,
            currentChildCounts[`${parentIdx}-${auIdx}`] ?? 0,
          ]),
        );

        return {
          parentIndex: parentIdx,
          grandparents: existing?.grandparents ?? [
            { name: '', nameKnown: false },
            { name: '', nameKnown: false },
          ],
          auntUncleCount: count,
          auntsUncles,
          auntUncleChildCounts,
        } as ParentBranch & { auntUncleChildCounts: Record<string, number> };
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
    existingBranches,
    formFields,
  ]);

  const branchesWithAuntsUncles = allParents
    .map((entry, parentIdx) => {
      const branch = existingBranches?.find((b) => b.parentIndex === parentIdx);
      return { entry, parentIdx, count: branch?.auntUncleCount ?? 0 };
    })
    .filter(({ count }) => count > 0);

  if (branchesWithAuntsUncles.length === 0) {
    return (
      <div className="pt-4">
        <p className="text-muted-foreground text-sm">
          No aunts or uncles to detail.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      {branchesWithAuntsUncles.map(({ entry, parentIdx, count }) => {
        const parentName = getParentDisplayName(entry, parentIdx);
        const branch = existingBranches?.find(
          (b) => b.parentIndex === parentIdx,
        );

        return (
          <Surface key={parentIdx} level={1} spacing="sm">
            <Heading level="h3">{parentName}&apos;s siblings</Heading>
            {Array.from({ length: count }, (_, auIdx) => {
              const key = `${parentIdx}-${auIdx}`;
              const existingAU = branch?.auntsUncles[auIdx];
              const hasChildren = hasChildrenMap[key];
              const childCount = childCounts[key] ?? 0;

              const currentName =
                typeof existingAU?.name === 'string' && existingAU.name
                  ? existingAU.name
                  : `Aunt/Uncle ${auIdx + 1}`;

              return (
                <Surface key={auIdx} level={2} spacing="sm">
                  <Heading level="h4">
                    {parentName}&apos;s sibling {auIdx + 1}
                  </Heading>
                  <PersonFields
                    nameToggle={false}
                    namespace={`auntUncle-${parentIdx}-${auIdx}`}
                    initial={{
                      name: existingAU?.name,
                      sex: existingAU?.biologicalSex,
                      attributes: existingAU?.attributes,
                    }}
                  />
                  <UnconnectedField
                    name={`auntUncle-${parentIdx}-${auIdx}-hasChildren`}
                    label={`Does ${currentName} have children?`}
                    component={BooleanField}
                    value={hasChildren}
                    onChange={(v: boolean | undefined) => {
                      setHasChildrenMap((prev) => ({ ...prev, [key]: v }));
                    }}
                  />
                  {hasChildren && (
                    <>
                      <UnconnectedField
                        name={`auntUncle-${parentIdx}-${auIdx}-childCount`}
                        inline
                        label="How many children?"
                        component={InputField}
                        type="number"
                        value={String(childCount)}
                        min={1}
                        max={20}
                        onChange={(v) => {
                          setChildCounts((prev) => ({
                            ...prev,
                            [key]: Number(v) || 1,
                          }));
                        }}
                      />
                      <UnconnectedField
                        name={`auntUncle-${parentIdx}-${auIdx}-hasPartner`}
                        label={`Does ${currentName} have a partner?`}
                        component={BooleanField}
                        value={hasPartnerMap[key]}
                        onChange={(v: boolean | undefined) => {
                          setHasPartnerMap((prev) => ({ ...prev, [key]: v }));
                        }}
                      />
                    </>
                  )}
                </Surface>
              );
            })}
          </Surface>
        );
      })}
    </div>
  );
}
