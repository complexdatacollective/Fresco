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
import {
  type PersonDetail,
  type SiblingDetail,
  type SiblingFamily,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getNodeForm } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function SiblingFamilyDetailStep() {
  return (
    <FormStoreProvider>
      <SiblingFamilyDetailForm />
    </FormStoreProvider>
  );
}

function SiblingFamilyDetailForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const rawFormFields = useSelector(getNodeForm);
  const formFields = useMemo(() => rawFormFields ?? [], [rawFormFields]);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const siblings = useMemo(
    () => (data.siblings as SiblingDetail[] | undefined) ?? [],
    [data.siblings],
  );
  const existingSiblingFamilies = data.siblingFamilies as
    | SiblingFamily[]
    | undefined;
  const siblingFamilyChildCounts = data.siblingFamilyChildCounts as
    | Record<number, number>
    | undefined;

  const siblingFamiliesWithChildren = useMemo(
    () =>
      (existingSiblingFamilies ?? []).map((sf) => ({
        sf,
        sibling: siblings[sf.siblingIndex],
        sibIdx: sf.siblingIndex,
      })),
    [existingSiblingFamilies, siblings],
  );

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();

      const siblingFamilies: SiblingFamily[] = (
        existingSiblingFamilies ?? []
      ).map((sf) => {
        const sibIdx = sf.siblingIndex;

        let partner: PersonDetail | undefined;
        if (sf.hasPartner) {
          const rawPartnerName = values[`siblingPartner-${sibIdx}-name`];
          const rawPartnerSex = values[`siblingPartner-${sibIdx}-sex`];
          partner = {
            name: typeof rawPartnerName === 'string' ? rawPartnerName : '',
            biologicalSex:
              typeof rawPartnerSex === 'string' ? rawPartnerSex : undefined,
            attributes: extractFormFieldAttributes(
              values,
              `siblingPartner-${sibIdx}`,
              formFields,
            ),
          };
        }

        const childCount =
          siblingFamilyChildCounts?.[sibIdx] ?? sf.children.length;

        const children: PersonDetail[] = Array.from(
          { length: childCount },
          (_, childIdx) => {
            const rawName = values[`nibling-${sibIdx}-${childIdx}-name`];
            const rawSex = values[`nibling-${sibIdx}-${childIdx}-sex`];
            return {
              name: typeof rawName === 'string' ? rawName : '',
              biologicalSex: typeof rawSex === 'string' ? rawSex : undefined,
              attributes: extractFormFieldAttributes(
                values,
                `nibling-${sibIdx}-${childIdx}`,
                formFields,
              ),
            };
          },
        );

        return {
          siblingIndex: sibIdx,
          hasPartner: sf.hasPartner,
          partner,
          children,
        };
      });

      setStepData({ siblingFamilies });
      return true;
    });
  }, [
    validateForm,
    getFormValues,
    setStepData,
    setBeforeNext,
    existingSiblingFamilies,
    siblingFamilyChildCounts,
    formFields,
  ]);

  if (siblingFamiliesWithChildren.length === 0) {
    return (
      <div className="pt-4">
        <p className="text-muted-foreground text-sm">
          No siblings with children to detail.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      {siblingFamiliesWithChildren.map(({ sf, sibling, sibIdx }) => {
        const siblingName =
          typeof sibling?.name === 'string' && sibling.name
            ? sibling.name
            : `Sibling ${sibIdx + 1}`;

        const childCount =
          siblingFamilyChildCounts?.[sibIdx] ?? sf.children.length;

        const existingPartner = sf.hasPartner ? sf.partner : undefined;

        return (
          <Surface key={sibIdx} level={1} spacing="sm">
            <Heading level="h3">{siblingName}&apos;s family</Heading>
            {sf.hasPartner && (
              <Surface level={2} spacing="sm">
                <Heading level="h4">{siblingName}&apos;s partner</Heading>
                <PersonFields
                  nameToggle={false}
                  namespace={`siblingPartner-${sibIdx}`}
                  initial={{
                    name: existingPartner?.name,
                    sex: existingPartner?.biologicalSex,
                    attributes: existingPartner?.attributes,
                  }}
                />
              </Surface>
            )}
            {Array.from({ length: childCount }, (_, childIdx) => {
              const existingChild = sf.children[childIdx];
              return (
                <Surface key={childIdx} level={2} spacing="sm">
                  <Heading level="h4">
                    {siblingName}&apos;s child {childIdx + 1}
                  </Heading>
                  <PersonFields
                    nameToggle={false}
                    namespace={`nibling-${sibIdx}-${childIdx}`}
                    initial={{
                      name: existingChild?.name,
                      sex: existingChild?.biologicalSex,
                      attributes: existingChild?.attributes,
                    }}
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
