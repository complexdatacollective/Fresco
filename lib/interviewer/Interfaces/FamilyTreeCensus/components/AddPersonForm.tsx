'use client';

import Field from '~/lib/form/components/Field/Field';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { type ParentEdgeType } from '~/lib/pedigree-layout/types';

export type AddPersonMode = 'parent' | 'child' | 'partner' | 'sibling';

const PARENT_EDGE_TYPE_OPTIONS: { value: ParentEdgeType; label: string }[] = [
  { value: 'social-parent', label: 'Social parent' },
  { value: 'bio-parent', label: 'Biological parent' },
  { value: 'donor', label: 'Donor' },
  { value: 'surrogate', label: 'Surrogate' },
  { value: 'co-parent', label: 'Co-parent' },
];

const CURRENT_EX_OPTIONS = [
  { value: 'current', label: 'Current' },
  { value: 'ex', label: 'Ex' },
];

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
  const partners =
    mode === 'child'
      ? [...edges.values()]
          .filter(
            (edge) =>
              edge.type === 'partner' &&
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
      label: node.label || 'Unknown',
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

      {mode === 'parent' && (
        <Field
          name="edgeType"
          label="Parent type"
          component={RadioGroupField}
          options={PARENT_EDGE_TYPE_OPTIONS}
          initialValue="social-parent"
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
