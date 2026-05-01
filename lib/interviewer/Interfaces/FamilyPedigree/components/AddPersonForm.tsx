'use client';

import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { useSelector } from 'react-redux';
import Field from '@codaco/fresco-ui/form/Field/Field';
import CheckboxGroupField from '@codaco/fresco-ui/form/fields/CheckboxGroup';
import RadioGroupField from '@codaco/fresco-ui/form/fields/RadioGroup';
import RichSelectGroupField from '@codaco/fresco-ui/form/fields/RichSelectGroup';
import { PARENT_EDGE_TYPE_OPTIONS_ALTER } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/fieldOptions';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getNodeLabelVariable } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export type AddPersonMode = 'parent' | 'child' | 'partner' | 'sibling';

const CURRENT_EX_OPTIONS = [
  { value: 'current', label: 'Current' },
  { value: 'ex', label: 'Ex' },
  { value: 'none', label: 'Not partners' },
];

type AddPersonFieldsProps = {
  mode: AddPersonMode;
  anchorNodeId: string;
  nodes: Map<string, NcNode>;
  edges: Map<string, NcEdge>;
  variableConfig: VariableConfig;
};

function getNodeName(
  nodeId: string,
  nodes: Map<string, NcNode>,
  nodeLabelVariable: string,
): string {
  const node = nodes.get(nodeId);
  return (node?.attributes[nodeLabelVariable] as string) || 'Unknown';
}

export default function AddPersonFields({
  mode,
  anchorNodeId,
  nodes,
  edges,
  variableConfig,
}: AddPersonFieldsProps) {
  const nodeLabelVariable = useSelector(getNodeLabelVariable);

  // For 'child' mode: find partners of the anchor node
  const partners =
    mode === 'child'
      ? [...edges.values()]
          .filter(
            (edge) =>
              edge.attributes[variableConfig.relationshipTypeVariable] ===
                'partner' &&
              (edge.from === anchorNodeId || edge.to === anchorNodeId),
          )
          .map((edge) => {
            const otherNodeId =
              edge.from === anchorNodeId ? edge.to : edge.from;
            return { id: otherNodeId, node: nodes.get(otherNodeId) };
          })
          .filter(
            (p): p is { id: string; node: NcNode } => p.node !== undefined,
          )
      : [];

  const partnerOptions = [
    ...partners.map(({ id, node }) => ({
      value: id,
      label: (node.attributes[nodeLabelVariable] as string) || 'Unknown',
    })),
    { value: '', label: 'No partner (solo)' },
  ];

  // Find existing parents of the anchor node (used in 'parent' and 'sibling' modes)
  const existingParents =
    mode === 'parent' || mode === 'sibling'
      ? [...edges.values()]
          .filter(
            (edge) =>
              edge.attributes[variableConfig.relationshipTypeVariable] !==
                'partner' && edge.to === anchorNodeId,
          )
          .map((edge) => edge.from)
          .filter((id) => nodes.has(id))
      : [];

  // For 'partner' mode: find children of the anchor node
  const children =
    mode === 'partner'
      ? [...edges.values()]
          .filter(
            (edge) =>
              edge.attributes[variableConfig.relationshipTypeVariable] !==
                'partner' && edge.from === anchorNodeId,
          )
          .map((edge) => edge.to)
          .filter((id) => nodes.has(id))
      : [];

  return (
    <>
      <PersonFields />

      {mode === 'parent' && (
        <Field
          name="edgeType"
          label="Parent type"
          component={RichSelectGroupField}
          options={PARENT_EDGE_TYPE_OPTIONS_ALTER}
          initialValue="biological"
        />
      )}

      {mode === 'parent' &&
        existingParents.map((parentId) => (
          <Field
            key={`partnership-${parentId}`}
            name={`partnership-${parentId}`}
            label={`Relationship with ${getNodeName(parentId, nodes, nodeLabelVariable)}?`}
            component={RadioGroupField}
            options={CURRENT_EX_OPTIONS}
            initialValue="current"
          />
        ))}

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
          options={CURRENT_EX_OPTIONS.filter((o) => o.value !== 'none')}
          initialValue="current"
        />
      )}

      {mode === 'sibling' && existingParents.length > 0 && (
        <Field
          name="sharedParents"
          label="Which parents are shared?"
          component={CheckboxGroupField}
          options={existingParents.map((id) => ({
            value: id,
            label: getNodeName(id, nodes, nodeLabelVariable),
          }))}
          initialValue={existingParents}
        />
      )}

      {mode === 'partner' &&
        children.map((childId) => (
          <Field
            key={`parentType-${childId}`}
            name={`parentType-${childId}`}
            label={`Parent type for ${getNodeName(childId, nodes, nodeLabelVariable)}?`}
            component={RichSelectGroupField}
            options={[
              ...PARENT_EDGE_TYPE_OPTIONS_ALTER,
              {
                value: 'none',
                label: 'Not a parent',
                description:
                  'Select this if you are not a parent of this child',
              },
            ]}
            initialValue="biological"
          />
        ))}
    </>
  );
}
