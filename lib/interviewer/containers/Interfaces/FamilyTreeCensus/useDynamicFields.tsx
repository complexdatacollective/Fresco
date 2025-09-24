import { useEffect, useMemo, useState } from 'react';
import RadioGroup from '~/lib/form/components/fields/RadioGroup';
import type { PlaceholderNodeProps } from './FamilyTreeNode';
import { type RelativeOption } from './useRelatives';

type FieldConfig = {
  fieldLabel: string;
  options: { label: string; value: string }[];
  type: string;
  variable: string;
  Component: React.ComponentType<any>;
  validation: {
    onSubmit: (value: { value: string }) => string | undefined;
  };
  _uniqueKey?: number;
};

export function useDynamicFields({
  step2Nodes,
  father,
  mother,
  firstCousinOptions,
  nieceOptions,
  grandchildrenOptions,
  show,
}: {
  step2Nodes: PlaceholderNodeProps[];
  father: PlaceholderNodeProps | null;
  mother: PlaceholderNodeProps | null;
  firstCousinOptions: RelativeOption[];
  nieceOptions: RelativeOption[];
  grandchildrenOptions: RelativeOption[];
  show: boolean;
}) {
  const [relationValue, setRelationValue] = useState('');

  useEffect(() => {
    if (!show) setRelationValue('');
  }, [show]);

  const processedFields = useMemo(() => {
    const baseField: FieldConfig = {
      fieldLabel: 'How is this person related to you?',
      options: [],
      type: 'ordinal',
      variable: 'relation',
      Component: (props) => (
        <RadioGroup
          {...props}
          onChange={(val: string) => {
            setRelationValue(val);
          }}
        />
      ),
      validation: {
        onSubmit: (value: { value: string }) =>
          value?.value ? undefined : 'Relation is required',
      },
    };

    const hasAuntOrUncle = step2Nodes.some((n) => /aunt|uncle/i.test(n.label));
    const hasSiblings = step2Nodes.some((n) => /brother|sister/i.test(n.label));
    const hasChildren = step2Nodes.some((n) =>
      ['son', 'daughter'].includes(n.label),
    );

    const dynamicBaseField = {
      ...baseField,
      options: [
        { label: 'Aunt', value: 'aunt' },
        { label: 'Uncle', value: 'uncle' },
        { label: 'Daughter', value: 'daughter' },
        { label: 'Son', value: 'son' },
        { label: 'Brother', value: 'brother' },
        { label: 'Sister', value: 'sister' },
        { label: 'Half Sister', value: 'halfSister' },
        { label: 'Half Brother', value: 'halfBrother' },
        ...(hasAuntOrUncle
          ? [
              { label: 'First Cousin (Male)', value: 'firstCousinMale' },
              { label: 'First Cousin (Female)', value: 'firstCousinFemale' },
            ]
          : []),
        ...(hasSiblings
          ? [
              { label: 'Niece', value: 'niece' },
              { label: 'Nephew', value: 'nephew' },
            ]
          : []),
        ...(hasChildren
          ? [
              { label: 'Granddaughter', value: 'granddaughter' },
              { label: 'Grandson', value: 'grandson' },
            ]
          : []),
      ],
    };

    const additionalFieldsMap: Record<string, FieldConfig> = {
      aunt: {
        fieldLabel: 'Who is the aunt related to?',
        options: [
          { label: 'Father', value: father?.id ?? '' },
          { label: 'Mother', value: mother?.id ?? '' },
        ],
        type: 'ordinal',
        variable: 'auntRelation',
        Component: RadioGroup,
        validation: {
          onSubmit: (value: { value: string }) =>
            value?.value ? undefined : 'Relation is required',
        },
      },
      uncle: {
        fieldLabel: 'Who is the uncle related to?',
        options: [
          { label: 'Father', value: father?.id ?? '' },
          { label: 'Mother', value: mother?.id ?? '' },
        ],
        type: 'ordinal',
        variable: 'uncleRelation',
        Component: RadioGroup,
        validation: {
          onSubmit: (value: { value: string }) =>
            value?.value ? undefined : 'Relation is required',
        },
      },
      halfSister: {
        fieldLabel: 'Who is the parent of your half sister?',
        options: [
          { label: 'Father', value: father?.id ?? '' },
          { label: 'Mother', value: mother?.id ?? '' },
        ],
        type: 'ordinal',
        variable: 'halfSisterRelation',
        Component: RadioGroup,
        validation: {
          onSubmit: (value: { value: string }) =>
            value?.value ? undefined : 'Relation is required',
        },
      },
      halfBrother: {
        fieldLabel: 'Who is the parent of your half brother?',
        options: [
          { label: 'Father', value: father?.id ?? '' },
          { label: 'Mother', value: mother?.id ?? '' },
        ],
        type: 'ordinal',
        variable: 'halfBrotherRelation',
        Component: RadioGroup,
        validation: {
          onSubmit: (value: { value: string }) =>
            value?.value ? undefined : 'Relation is required',
        },
      },
      firstCousinMale: {
        fieldLabel: 'Who is the parent of your first cousin?',
        options: firstCousinOptions,
        type: 'ordinal',
        variable: 'firstCousinMaleRelation',
        Component: RadioGroup,
        validation: {
          onSubmit: (value: { value: string }) =>
            value?.value ? undefined : 'Relation is required',
        },
      },
      firstCousinFemale: {
        fieldLabel: 'Who is the parent of your first cousin?',
        options: firstCousinOptions,
        type: 'ordinal',
        variable: 'firstCousinFemaleRelation',
        Component: RadioGroup,
        validation: {
          onSubmit: (value: { value: string }) =>
            value?.value ? undefined : 'Relation is required',
        },
      },
      niece: {
        fieldLabel: 'Who is the parent of your niece?',
        options: nieceOptions,
        type: 'ordinal',
        variable: 'nieceRelation',
        Component: RadioGroup,
        validation: {
          onSubmit: (value: { value: string }) =>
            value?.value ? undefined : 'Relation is required',
        },
      },
      nephew: {
        fieldLabel: 'Who is the parent of your nephew?',
        options: nieceOptions,
        type: 'ordinal',
        variable: 'nephewRelation',
        Component: RadioGroup,
        validation: {
          onSubmit: (value: { value: string }) =>
            value?.value ? undefined : 'Relation is required',
        },
      },
      granddaughter: {
        fieldLabel: 'Who is the parent of your granddaughter?',
        options: grandchildrenOptions,
        type: 'ordinal',
        variable: 'granddaughterRelation',
        Component: RadioGroup,
        validation: {
          onSubmit: (value: { value: string }) =>
            value?.value ? undefined : 'Relation is required',
        },
      },
      grandson: {
        fieldLabel: 'Who is the parent of your grandson?',
        options: grandchildrenOptions,
        type: 'ordinal',
        variable: 'grandsonRelation',
        Component: RadioGroup,
        validation: {
          onSubmit: (value: { value: string }) =>
            value?.value ? undefined : 'Relation is required',
        },
      },
    };

    const processedFields: FieldConfig[] = [
      dynamicBaseField,
      ...(relationValue && additionalFieldsMap[relationValue]
        ? [{ ...additionalFieldsMap[relationValue], _uniqueKey: Date.now() }]
        : []),
    ];

    return processedFields;
  }, [
    step2Nodes,
    father,
    mother,
    firstCousinOptions,
    nieceOptions,
    grandchildrenOptions,
    relationValue,
  ]);

  return { processedFields, relationValue, setRelationValue };
}
