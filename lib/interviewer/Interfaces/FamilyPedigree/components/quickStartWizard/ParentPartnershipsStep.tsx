'use client';

import { useEffect, useRef } from 'react';
import Paragraph from '~/components/typography/Paragraph';
import { useWizard } from '~/lib/dialogs/useWizard';
import Field from '~/lib/form/components/Field/Field';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import {
  type ParentDetail,
  type ParentPartnership,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const partnershipOptions = [
  { value: 'current', label: 'Current partners' },
  { value: 'ex', label: 'Ex-partners' },
  { value: 'none', label: 'Never partners' },
];

export default function ParentPartnershipsStep() {
  return (
    <FormStoreProvider>
      <ParentPartnershipsForm />
    </FormStoreProvider>
  );
}

const EDGE_TYPE_LABELS: Record<string, string> = {
  biological: 'Biological parent',
  social: 'Social parent',
  donor: 'Donor',
  surrogate: 'Surrogate',
};

function getParentLabel(parent: ParentDetail | undefined) {
  if (parent?.name) return parent.name;

  const role = EDGE_TYPE_LABELS[parent?.edgeType ?? ''] ?? 'Parent';

  return `${role} (assigned ${parent?.biologicalSex} at birth)`;
}

function ParentPartnershipsForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const errors = useFormStore((s) => s.errors);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const parents = (data.parents as ParentDetail[] | undefined) ?? [];
  const existingPartnerships =
    (data.parentPartnerships as ParentPartnership[] | undefined) ?? [];

  const pairs: [number, number][] = [];
  for (let i = 0; i < parents.length; i++) {
    for (let j = i + 1; j < parents.length; j++) {
      pairs.push([i, j]);
    }
  }

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const parentPartnerships: ParentPartnership[] = [];

      for (let i = 0; i < parents.length; i++) {
        for (let j = i + 1; j < parents.length; j++) {
          const answer = values[`partnership-${i}-${j}`];
          if (answer === 'current') {
            parentPartnerships.push({
              parentIndices: [i, j],
              isActive: true,
            });
          } else if (answer === 'ex') {
            parentPartnerships.push({
              parentIndices: [i, j],
              isActive: false,
            });
          }
        }
      }

      setStepData({ parentPartnerships });
      return true;
    });
  }, [validateForm, getFormValues, setStepData, setBeforeNext, parents.length]);

  return (
    <div className="flex flex-col gap-6">
      {pairs.map(([i, j]) => {
        const existing = existingPartnerships.find(
          (p) => p.parentIndices[0] === i && p.parentIndices[1] === j,
        );
        const initialValue = existing
          ? existing.isActive
            ? 'current'
            : 'ex'
          : undefined;

        return (
          <Field
            key={`partnership-${i}-${j}`}
            name={`partnership-${i}-${j}`}
            label={`Are ${getParentLabel(parents[i])} and ${getParentLabel(parents[j])} partners?`}
            hint={
              <>
                <Paragraph>
                  This includes current and past romantic partnerships, but{' '}
                  <strong>not co-parenting partnerships</strong> where the
                  parents were never romantically involved.
                </Paragraph>
                <Paragraph>
                  If either parent is <strong>deceased</strong>, please answer
                  based on whether they were partners while both were alive.
                </Paragraph>
              </>
            }
            component={RadioGroupField}
            options={partnershipOptions}
            initialValue={initialValue}
          />
        );
      })}
    </div>
  );
}
