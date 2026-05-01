'use client';

import { useMemo } from 'react';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import Field from '@codaco/fresco-ui/form/Field/Field';
import RadioGroupField from '@codaco/fresco-ui/form/fields/RadioGroup';
import { useFormValue } from '@codaco/fresco-ui/form/hooks/useFormValue';

const partnershipOptions = [
  { value: 'current', label: 'Current partners' },
  { value: 'ex', label: 'Ex-partners' },
  { value: 'none', label: 'Never partners' },
];

type ParentEntry = {
  id: string;
  name: string | undefined;
  sex: string | undefined;
};

const MAX_ADDITIONAL_PARENTS = 20;

const BIO_PARENT_FIELDS = [
  'egg-parent.name',
  'egg-parent.sex-at-birth',
  'egg-parent.gestationalCarrier',
  'sperm-parent.name',
  'sperm-parent.sex-at-birth',
  'gestational-carrier.name',
  'gestational-carrier.sex-at-birth',
  'hasOtherParents',
  'otherParentCount',
  ...Array.from({ length: MAX_ADDITIONAL_PARENTS }, (_, i) => [
    `additional-parent[${String(i)}].name`,
    `additional-parent[${String(i)}].sex-at-birth`,
  ]).flat(),
] as const;

function getParentLabel(parent: ParentEntry, index: number) {
  if (parent.name) return parent.name;
  return `Parent ${String(index + 1)} (assigned ${parent.sex ?? 'unknown'} at birth)`;
}

export default function ParentPartnershipsStep() {
  const values = useFormValue(BIO_PARENT_FIELDS);

  const parents = useMemo<ParentEntry[]>(() => {
    const list: ParentEntry[] = [
      {
        id: 'egg-parent',
        name: values['egg-parent.name'] as string | undefined,
        sex: values['egg-parent.sex-at-birth'] as string | undefined,
      },
      {
        id: 'sperm-parent',
        name: values['sperm-parent.name'] as string | undefined,
        sex: values['sperm-parent.sex-at-birth'] as string | undefined,
      },
    ];

    if (values['egg-parent.gestationalCarrier'] === false) {
      list.push({
        id: 'gestational-carrier',
        name: values['gestational-carrier.name'] as string | undefined,
        sex: values['gestational-carrier.sex-at-birth'] as string | undefined,
      });
    }

    if (values.hasOtherParents === true) {
      const count = Number(values.otherParentCount ?? 0);
      for (let i = 0; i < count; i++) {
        list.push({
          id: `additional-parent-${String(i)}`,
          name: values[`additional-parent[${String(i)}].name`] as
            | string
            | undefined,
          sex: values[`additional-parent[${String(i)}].sex-at-birth`] as
            | string
            | undefined,
        });
      }
    }

    return list;
  }, [values]);

  const pairs = useMemo(() => {
    const result: [number, number][] = [];
    for (let i = 0; i < parents.length; i++) {
      for (let j = i + 1; j < parents.length; j++) {
        result.push([i, j]);
      }
    }
    return result;
  }, [parents.length]);

  if (parents.length < 2) return null;

  return (
    <>
      <div className="mb-8">
        <Paragraph>
          We now want to ask about relationships between the parents you named.
          This includes current and past romantic partnerships, but{' '}
          <strong>not co-parenting partnerships</strong> where the parents were
          never romantically involved.
        </Paragraph>
        <Paragraph>
          If either parent is <strong>deceased</strong>, please answer based on
          whether they were partners while both were alive.
        </Paragraph>
      </div>
      <div className="flex flex-col gap-6">
        {pairs.map(([i, j]) => {
          const parentI = parents[i]!;
          const parentJ = parents[j]!;

          return (
            <Field
              key={`partnership-${parentI.id}-${parentJ.id}`}
              name={`partnership-${parentI.id}-${parentJ.id}`}
              label={`Are ${getParentLabel(parentI, i)} and ${getParentLabel(parentJ, j)} partners?`}
              component={RadioGroupField}
              options={partnershipOptions}
              required
            />
          );
        })}
      </div>
    </>
  );
}
