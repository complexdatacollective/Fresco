'use client';

import { type SkipContext } from '@codaco/fresco-ui/dialogs/DialogProvider';
import type useDialog from '@codaco/fresco-ui/dialogs/useDialog';
import Field from '@codaco/fresco-ui/form/Field/Field';
import RadioGroupField from '@codaco/fresco-ui/form/fields/RadioGroup';
import RichSelectGroupField from '@codaco/fresco-ui/form/fields/RichSelectGroup';
import { PARENT_EDGE_TYPE_OPTIONS_ALTER } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/fieldOptions';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import {
  type NcEdge,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import {
  type CommitBatch,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const KNOWN_PERSON_KEYS = new Set(['name']);

function extractCustomAttributes(
  obj: Record<string, unknown>,
): Record<string, VariableValue> | undefined {
  const attrs: Record<string, VariableValue> = {};
  let hasAttrs = false;
  for (const [key, val] of Object.entries(obj)) {
    if (!KNOWN_PERSON_KEYS.has(key) && val !== undefined) {
      attrs[key] = val as VariableValue;
      hasAttrs = true;
    }
  }
  return hasAttrs ? attrs : undefined;
}

const partnershipOptions = [
  { value: 'current', label: 'Current partners' },
  { value: 'ex', label: 'Ex-partners' },
  { value: 'none', label: 'Never partners' },
];

function ParentDetailsStep() {
  return (
    <>
      <PersonFields namespace="parent" />
      <Field
        name="edgeType"
        label="Parent type"
        component={RichSelectGroupField}
        options={PARENT_EDGE_TYPE_OPTIONS_ALTER}
        initialValue="biological"
        required
      />
    </>
  );
}

function ExistingParentPartnershipsStep({
  existingParents,
}: {
  existingParents: { id: string; label: string }[];
}) {
  if (existingParents.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {existingParents.map((parent) => (
        <Field
          key={`partnership-${parent.id}`}
          name={`partnership-${parent.id}`}
          label={`Are the new parent and ${parent.label} partners?`}
          component={RadioGroupField}
          options={partnershipOptions}
          required
        />
      ))}
    </div>
  );
}

function getExistingParentIds(
  anchorNodeId: string,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): string[] {
  const parentIds: string[] = [];
  for (const edge of edges.values()) {
    if (
      edge.to === anchorNodeId &&
      edge.attributes[variableConfig.relationshipTypeVariable] !== 'partner'
    ) {
      parentIds.push(edge.from);
    }
  }
  return parentIds;
}

function transformToCommitBatch(
  formValues: Record<string, unknown>,
  anchorNodeId: string,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): CommitBatch {
  const parentValues = (formValues.parent ?? {}) as Record<string, unknown>;
  const name = (parentValues.name as string | undefined) ?? '';
  const customAttrs = extractCustomAttributes(parentValues);

  const edgeType = (formValues.edgeType as string | undefined) ?? 'biological';

  const parentTempId = '__new-parent__';

  const edgeAttributes: Record<string, VariableValue> = {
    [variableConfig.relationshipTypeVariable]: edgeType,
    [variableConfig.isActiveVariable]: true,
  };
  if (edgeType === 'surrogate') {
    edgeAttributes[variableConfig.isGestationalCarrierVariable] = true;
  }

  const batch: CommitBatch = {
    nodes: [
      {
        tempId: parentTempId,
        data: {
          attributes: {
            [variableConfig.nodeLabelVariable]: name,
            [variableConfig.egoVariable]: false,
            ...customAttrs,
          },
        },
      },
    ],
    edges: [
      {
        source: parentTempId,
        target: anchorNodeId,
        data: { attributes: edgeAttributes },
      },
    ],
  };

  const existingParentIds = getExistingParentIds(
    anchorNodeId,
    edges,
    variableConfig,
  );
  for (const parentId of existingParentIds) {
    const value = formValues[`partnership-${parentId}`] as string | undefined;
    if (value === 'current' || value === 'ex') {
      batch.edges.push({
        source: parentTempId,
        target: parentId,
        data: {
          attributes: {
            [variableConfig.relationshipTypeVariable]: 'partner',
            [variableConfig.isActiveVariable]: value === 'current',
          },
        },
      });
    }
  }

  return batch;
}

export async function openAddParentWizard(
  openDialog: ReturnType<typeof useDialog>['openDialog'],
  anchorNodeId: string,
  nodes: Map<string, NcNode>,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): Promise<CommitBatch | null> {
  const existingParentIds = getExistingParentIds(
    anchorNodeId,
    edges,
    variableConfig,
  );
  const existingParents = existingParentIds
    .map((id) => {
      const node = nodes.get(id);
      if (!node) return null;
      const name = node.attributes[variableConfig.nodeLabelVariable];
      return {
        id,
        label:
          typeof name === 'string' && name.length > 0 ? name : 'Unknown person',
      };
    })
    .filter((p) => p !== null);

  const result = await openDialog({
    type: 'wizard',
    title: 'Add parent',
    progress: null,
    steps: [
      {
        title: 'Parent details',
        content: ParentDetailsStep,
      },
      {
        title: 'Partnerships',
        content: () => (
          <ExistingParentPartnershipsStep existingParents={existingParents} />
        ),
        skip: (_ctx: SkipContext) => existingParentIds.length === 0,
      },
    ],
    onFinish: (formValues: Record<string, unknown>) => {
      return transformToCommitBatch(
        formValues,
        anchorNodeId,
        edges,
        variableConfig,
      );
    },
  });

  if (
    result &&
    typeof result === 'object' &&
    'nodes' in result &&
    'edges' in result
  ) {
    return result as CommitBatch;
  }

  return null;
}
