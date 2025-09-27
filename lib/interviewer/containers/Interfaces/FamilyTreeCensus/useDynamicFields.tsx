import { useEffect, useMemo, useState } from 'react';
import RadioGroup from '~/lib/form/components/fields/RadioGroup';
import {
  buildBaseOptions,
  createRelationField,
  getRelationFlags,
} from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/dynamicFieldsUtils';
import type { PlaceholderNodeProps } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/FamilyTreeNode';
import { type RelativeOption } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/useRelatives';

export type FieldConfig = {
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

    const flags = getRelationFlags(step2Nodes);

    const dynamicBaseField = {
      ...baseField,
      options: buildBaseOptions(flags),
    };

    const additionalFieldsMap: Record<string, FieldConfig> = {
      aunt: createRelationField('Who is the aunt related to?', 'auntRelation', [
        { label: 'Father', value: father?.id ?? '' },
        { label: 'Mother', value: mother?.id ?? '' },
      ]),
      uncle: createRelationField(
        'Who is the uncle related to?',
        'uncleRelation',
        [
          { label: 'Father', value: father?.id ?? '' },
          { label: 'Mother', value: mother?.id ?? '' },
        ],
      ),
      halfSister: createRelationField(
        'Who is the parent of your half sister?',
        'halfSisterRelation',
        [
          { label: 'Father', value: father?.id ?? '' },
          { label: 'Mother', value: mother?.id ?? '' },
        ],
      ),
      halfBrother: createRelationField(
        'Who is the parent of your half brother?',
        'halfBrotherRelation',
        [
          { label: 'Father', value: father?.id ?? '' },
          { label: 'Mother', value: mother?.id ?? '' },
        ],
      ),
      firstCousinMale: createRelationField(
        'Who is the parent of your first cousin?',
        'firstCousinMaleRelation',
        firstCousinOptions,
      ),
      firstCousinFemale: createRelationField(
        'Who is the parent of your first cousin?',
        'firstCousinFemaleRelation',
        firstCousinOptions,
      ),
      niece: createRelationField(
        'Who is the parent of your niece?',
        'nieceRelation',
        nieceOptions,
      ),
      nephew: createRelationField(
        'Who is the parent of your nephew?',
        'nephewRelation',
        nieceOptions,
      ),
      granddaughter: createRelationField(
        'Who is the parent of your granddaughter?',
        'granddaughterRelation',
        grandchildrenOptions,
      ),
      grandson: createRelationField(
        'Who is the parent of your grandson?',
        'grandsonRelation',
        grandchildrenOptions,
      ),
    };

    const additionalField = relationValue
      ? additionalFieldsMap[relationValue]
      : null;

    const processed: FieldConfig[] = [
      dynamicBaseField,
      ...(additionalField
        ? [{ ...additionalField, _uniqueKey: Date.now() }]
        : []),
    ];

    return processed;
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
