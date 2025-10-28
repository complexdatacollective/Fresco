import { type VariableType } from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { useEffect, useMemo, useState } from 'react';
import RadioGroup from '~/lib/form/components/fields/RadioGroup';
import { type RelativeOption } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/useRelatives';
import {
  buildBaseOptions,
  createRelationField,
  getRelationFlags,
  type RadioGroupConfig,
} from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/utils/dynamicFieldsUtils';
import { type FamilyTreeNodeType } from './components/FamilyTreeNode';

const fatherKey = 'father';
const motherKey = 'mother';

export type FieldConfig<Props = Record<string, unknown>> = {
  fieldLabel: string;
  options: { label: string; value: VariableValue }[];
  type: VariableType;
  variable: string;
  Component: React.ComponentType<Props>;
  validation: {
    onSubmit: (value: { value: string }) => string | undefined;
    onChange: () => string | undefined;
  };
  _uniqueKey?: number;
};

export function useDynamicFields({
  nodes,
  firstCousinOptions,
  nieceOptions,
  grandchildrenOptions,
  show,
}: {
  nodes: FamilyTreeNodeType[];
  firstCousinOptions: RelativeOption[];
  nieceOptions: RelativeOption[];
  grandchildrenOptions: RelativeOption[];
  show: boolean;
}) {
  const [relationValue, setRelationValue] = useState<string | null>(null);

  useEffect(() => {
    if (!show) setRelationValue(null);
  }, [show]);

  const processedFields = useMemo(() => {
    const baseField: RadioGroupConfig = {
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
        onChange: () => undefined,
      },
    };

    const flags = getRelationFlags(nodes);

    const dynamicBaseField = {
      ...baseField,
      options: buildBaseOptions(flags),
    };

    const additionalFieldsMap: Record<string, RadioGroupConfig> = {
      aunt: createRelationField('Who is the aunt related to?', 'auntRelation', [
        { label: 'Father', value: fatherKey },
        { label: 'Mother', value: motherKey },
      ]),
      uncle: createRelationField(
        'Who is the uncle related to?',
        'uncleRelation',
        [
          { label: 'Father', value: fatherKey },
          { label: 'Mother', value: motherKey },
        ],
      ),
      halfSister: createRelationField(
        'Who is the parent of your half sister?',
        'halfSisterRelation',
        [
          { label: 'Father', value: fatherKey },
          { label: 'Mother', value: motherKey },
        ],
      ),
      halfBrother: createRelationField(
        'Who is the parent of your half brother?',
        'halfBrotherRelation',
        [
          { label: 'Father', value: fatherKey },
          { label: 'Mother', value: motherKey },
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

    const processed: RadioGroupConfig[] = [
      dynamicBaseField,
      ...(additionalField
        ? [{ ...additionalField, _uniqueKey: Date.now() }]
        : []),
    ];

    return processed;
  }, [
    nodes,
    firstCousinOptions,
    nieceOptions,
    grandchildrenOptions,
    relationValue,
  ]);

  return { processedFields, relationValue, setRelationValue };
}
