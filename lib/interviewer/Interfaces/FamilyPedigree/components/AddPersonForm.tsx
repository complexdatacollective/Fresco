'use client';

import { useSelector } from 'react-redux';
import Field from '~/lib/form/components/Field/Field';
import BooleanField from '~/lib/form/components/fields/Boolean';
import InputField from '~/lib/form/components/fields/InputField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import { PARENT_EDGE_TYPE_OPTIONS } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/fieldOptions';
import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import {
  getBiologicalSexOptions,
  getNodeLabelVariable,
  getResolvedNodeFormFields,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export type AddPersonMode = 'parent' | 'child' | 'partner' | 'sibling';

const CURRENT_EX_OPTIONS = [
  { value: 'current', label: 'Current' },
  { value: 'ex', label: 'Ex' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  Text: InputField,
  Number: NumberCounterField,
  RadioGroup: RadioGroupField,
  Boolean: BooleanField,
};

type AddPersonFieldsProps = {
  mode: AddPersonMode;
  anchorNodeId: string;
  nodes: Map<string, NodeData>;
  edges: Map<string, StoreEdge>;
};

export default function AddPersonFields({
  mode,
  anchorNodeId,
  nodes,
  edges,
}: AddPersonFieldsProps) {
  const sexOptions = useSelector(getBiologicalSexOptions);
  const nodeLabelVariable = useSelector(getNodeLabelVariable);
  const formFields = useSelector(getResolvedNodeFormFields);

  const partners =
    mode === 'child'
      ? [...edges.values()]
          .filter(
            (edge) =>
              edge.relationshipType === 'partner' &&
              (edge.source === anchorNodeId || edge.target === anchorNodeId),
          )
          .map((edge) => {
            const otherNodeId =
              edge.source === anchorNodeId ? edge.target : edge.source;
            return { id: otherNodeId, node: nodes.get(otherNodeId) };
          })
          .filter(
            (p): p is { id: string; node: NodeData } => p.node !== undefined,
          )
      : [];

  const partnerOptions = [
    ...partners.map(({ id, node }) => ({
      value: id,
      label: (node.attributes[nodeLabelVariable] as string) || 'Unknown',
    })),
    { value: '', label: 'No partner (solo)' },
  ];

  return (
    <>
      <Field
        name="name"
        label="Name"
        component={InputField}
        placeholder="Enter name or leave blank if unknown"
      />

      <Field
        name="biologicalSex"
        label="Sex assigned at birth"
        component={RadioGroupField}
        options={sexOptions}
      />

      {formFields.map((field) => {
        const Component = COMPONENT_MAP[field.component];
        if (!Component) return null;
        return (
          <Field
            key={field.variableId}
            name={field.variableId}
            label={field.prompt}
            component={Component}
            options={field.options}
            required={field.validation?.required === true}
          />
        );
      })}

      {mode === 'parent' && (
        <Field
          name="edgeType"
          label="Parent type"
          component={RadioGroupField}
          options={PARENT_EDGE_TYPE_OPTIONS}
          initialValue="biological"
        />
      )}

      {mode === 'child' && partners.length > 0 && (
        <Field
          name="partnerId"
          label="With which partner?"
          component={RadioGroupField}
          options={partnerOptions}
        />
      )}

      {mode === 'partner' && (
        <Field
          name="current"
          label="Current or ex partner?"
          component={RadioGroupField}
          options={CURRENT_EX_OPTIONS}
          initialValue="current"
        />
      )}
    </>
  );
}
