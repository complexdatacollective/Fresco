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
import {
  getAllParents,
  getParentDisplayName,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/getAllParents';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import {
  type AuntUncleDetail,
  type ParentBranch,
  type PersonDetail,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getNodeForm } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function AuntUncleChildrenStep() {
  return (
    <FormStoreProvider>
      <AuntUncleChildrenForm />
    </FormStoreProvider>
  );
}

function AuntUncleChildrenForm() {
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
  const auntUncleChildCounts = data.auntUncleChildCounts as
    | Record<string, number>
    | undefined;

  const branchesWithChildren = useMemo(
    () =>
      allParents
        .map((entry, parentIdx) => {
          const branch = existingBranches?.find(
            (b) => b.parentIndex === parentIdx,
          );
          const auntsUnclesWithChildren = (branch?.auntsUncles ?? [])
            .map((au, auIdx) => ({ au, auIdx }))
            .filter(({ au }) => au.hasChildren);
          return { entry, parentIdx, auntsUnclesWithChildren };
        })
        .filter(
          ({ auntsUnclesWithChildren }) => auntsUnclesWithChildren.length > 0,
        ),
    [allParents, existingBranches],
  );

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();

      const parentBranches: ParentBranch[] = allParents.map((_, parentIdx) => {
        const existing = existingBranches?.find(
          (b) => b.parentIndex === parentIdx,
        );
        const count = existing?.auntUncleCount ?? 0;

        const auntsUncles: AuntUncleDetail[] = Array.from(
          { length: count },
          (_, auIdx) => {
            const existingAU = existing?.auntsUncles[auIdx];

            if (!existingAU?.hasChildren) {
              return (
                existingAU ?? {
                  name: '',
                  hasChildren: false,
                  children: [] as [],
                }
              );
            }

            const childCount =
              auntUncleChildCounts?.[`${parentIdx}-${auIdx}`] ??
              existingAU.children.length;

            let partner: PersonDetail | undefined;
            if (existingAU.hasPartner) {
              const rawPartnerName =
                values[`auntUnclePartner-${parentIdx}-${auIdx}-name`];
              const rawPartnerSex =
                values[`auntUnclePartner-${parentIdx}-${auIdx}-sex`];
              partner = {
                name: typeof rawPartnerName === 'string' ? rawPartnerName : '',
                biologicalSex:
                  typeof rawPartnerSex === 'string' ? rawPartnerSex : undefined,
                attributes: extractFormFieldAttributes(
                  values,
                  `auntUnclePartner-${parentIdx}`,
                  auIdx,
                  formFields,
                ),
              };
            }

            const children: PersonDetail[] = Array.from(
              { length: childCount },
              (_, childIdx) => {
                const rawName =
                  values[`cousin-${parentIdx}-${auIdx}-${childIdx}-name`];
                const rawSex =
                  values[`cousin-${parentIdx}-${auIdx}-${childIdx}-sex`];
                return {
                  name: typeof rawName === 'string' ? rawName : '',
                  biologicalSex:
                    typeof rawSex === 'string' ? rawSex : undefined,
                  attributes: extractFormFieldAttributes(
                    values,
                    `cousin-${parentIdx}-${auIdx}`,
                    childIdx,
                    formFields,
                  ),
                };
              },
            );

            return {
              name: existingAU.name,
              biologicalSex: existingAU.biologicalSex,
              attributes: existingAU.attributes,
              hasChildren: true,
              hasPartner: existingAU.hasPartner,
              partner,
              children,
            };
          },
        );

        return {
          parentIndex: parentIdx,
          grandparents: existing?.grandparents ?? [
            { name: '', nameKnown: false },
            { name: '', nameKnown: false },
          ],
          auntUncleCount: count,
          auntsUncles,
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
    existingBranches,
    auntUncleChildCounts,
    formFields,
  ]);

  if (branchesWithChildren.length === 0) {
    return (
      <div className="pt-4">
        <p className="text-muted-foreground text-sm">
          No aunts or uncles with children to detail.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      {branchesWithChildren.map(
        ({ entry, parentIdx, auntsUnclesWithChildren }) => {
          const parentName = getParentDisplayName(entry, parentIdx);

          return (
            <Surface key={parentIdx} level={1} spacing="sm">
              <Heading level="h3">
                {parentName}&apos;s siblings&apos; families
              </Heading>
              {auntsUnclesWithChildren.map(({ au, auIdx }) => {
                const auName =
                  typeof au.name === 'string' && au.name
                    ? au.name
                    : `Aunt/Uncle ${auIdx + 1}`;

                const childCount =
                  auntUncleChildCounts?.[`${parentIdx}-${auIdx}`] ??
                  (au.hasChildren ? au.children.length : 0);

                const existingPartner =
                  au.hasChildren && au.hasPartner ? au.partner : undefined;

                return (
                  <Surface key={auIdx} level={2} spacing="sm">
                    <Heading level="h4">{auName}&apos;s family</Heading>
                    {au.hasChildren && au.hasPartner && (
                      <Surface level={3} spacing="sm">
                        <Heading level="h4">{auName}&apos;s partner</Heading>
                        <PersonFields
                          index={auIdx}
                          prefix={`auntUnclePartner-${parentIdx}`}
                          initial={{
                            name: existingPartner?.name,
                            sex: existingPartner?.biologicalSex,
                          }}
                        />
                      </Surface>
                    )}
                    {Array.from({ length: childCount }, (_, childIdx) => {
                      const existingChild = au.hasChildren
                        ? au.children[childIdx]
                        : undefined;
                      return (
                        <Surface key={childIdx} level={3} spacing="sm">
                          <Heading level="h4">
                            {auName}&apos;s child {childIdx + 1}
                          </Heading>
                          <PersonFields
                            index={childIdx}
                            prefix={`cousin-${parentIdx}-${auIdx}`}
                            initial={{
                              name: existingChild?.name,
                              sex: existingChild?.biologicalSex,
                            }}
                          />
                        </Surface>
                      );
                    })}
                  </Surface>
                );
              })}
            </Surface>
          );
        },
      )}
    </div>
  );
}
