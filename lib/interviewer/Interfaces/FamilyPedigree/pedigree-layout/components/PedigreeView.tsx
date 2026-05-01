'use client';

import {
    type NcEdge,
    type NcNode,
    type VariableValue,
} from '@codaco/shared-consts';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Node from '@codaco/fresco-ui/Node';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';
import useDialog from '@codaco/fresco-ui/dialogs/useDialog';
import Field from '@codaco/fresco-ui/form/Field/Field';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import AddPersonFields, {
    type AddPersonMode,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/AddPersonForm';
import { openAddChildWizard } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/AddChildWizard';
import { openAddParentWizard } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/AddParentWizard';
import { openAddSiblingWizard } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/AddSiblingWizard';
import { openDefineParentsWizard } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/DefineParentsWizard';
import { useFamilyPedigreeStore } from '~/lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigreeProvider';
import NodeContextMenu, {
    type NodeContextMenuAction,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/components/NodeContextMenu';
import PedigreeLayout from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/components/PedigreeLayout';
import PedigreeNode, {
    computeNodeDisplayLabels,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/components/PedigreeNode';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import {
    getEdgeTypeKey,
    getIsActiveVariable,
    getIsGestationalCarrierVariable,
    getRelationshipTypeVariable,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/edgeUtils';
import {
    getEgoVariable,
    getNodeLabelVariable,
    getNodeTypeKey,
    getResolvedNodeFormFields,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';
import { type ParentEdge } from '~/schemas/familyPedigree';

type PedigreeViewProps = {
  overrideNodes?: Map<string, NcNode>;
  overrideEdges?: Map<string, NcEdge>;
  activeNominationVariable?: string | null;
  onToggleAttribute?: (nodeId: string, variable: string) => void;
};

export default function PedigreeView({
  overrideNodes,
  overrideEdges,
  activeNominationVariable: activeNominationVariableProp,
  onToggleAttribute,
}: PedigreeViewProps = {}) {
  const storeNodes = useFamilyPedigreeStore((s) => s.network.nodes);
  const storeEdges = useFamilyPedigreeStore((s) => s.network.edges);
  const storeActiveNominationVariable = useFamilyPedigreeStore(
    (s) => s.activeNominationVariable,
  );

  const nodes = overrideNodes ?? storeNodes;
  const edges = overrideEdges ?? storeEdges;
  const activeNominationVariable =
    activeNominationVariableProp ?? storeActiveNominationVariable;

  const addNode = useFamilyPedigreeStore((s) => s.addNode);
  const addEdge = useFamilyPedigreeStore((s) => s.addEdge);
  const updateNode = useFamilyPedigreeStore((s) => s.updateNode);
  const removeNode = useFamilyPedigreeStore((s) => s.removeNode);
  const commitBatch = useFamilyPedigreeStore((s) => s.commitBatch);

  const nodeType = useSelector(getNodeTypeKey);
  const edgeType = useSelector(getEdgeTypeKey);
  const nodeLabelVariable = useSelector(getNodeLabelVariable);
  const egoVariable = useSelector(getEgoVariable);
  const relationshipTypeVariable = useSelector(getRelationshipTypeVariable);
  const isActiveVariable = useSelector(getIsActiveVariable);
  const isGestationalCarrierVariable = useSelector(
    getIsGestationalCarrierVariable,
  );
  const resolvedFormFields = useSelector(getResolvedNodeFormFields);

  const variableConfig: VariableConfig = {
    nodeType,
    edgeType,
    nodeLabelVariable,
    egoVariable,
    relationshipTypeVariable,
    isActiveVariable,
    isGestationalCarrierVariable,
  };

  const { openDialog } = useDialog();

  const { nodeWidth, nodeHeight, measurementContainer } = useNodeMeasurement({
    component: <Node size="sm" />,
  });

  const handleAddPerson = async (nodeId: string, mode: AddPersonMode) => {
    const result = await openDialog({
      type: 'form',
      title: `Add ${mode}`,
      submitLabel: 'Add',
      cancelLabel: 'Cancel',
      children: (
        <AddPersonFields
          mode={mode}
          anchorNodeId={nodeId}
          nodes={nodes}
          edges={edges}
          variableConfig={variableConfig}
        />
      ),
    });

    if (!result) return;

    const name = typeof result.name === 'string' ? result.name : '';

    const formAttrs: Record<string, VariableValue> = {};
    for (const field of resolvedFormFields) {
      if (result[field.variableId] !== undefined) {
        formAttrs[field.variableId] = result[field.variableId] as VariableValue;
      }
    }

    const newNodeId = addNode({
      attributes: {
        [nodeLabelVariable]: name,
        [egoVariable]: false,
        ...formAttrs,
      },
    });

    switch (mode) {
      case 'parent': {
        addEdge({
          from: newNodeId,
          to: nodeId,
          attributes: {
            [relationshipTypeVariable]:
              (result.edgeType as ParentEdge['relationshipType'] | undefined) ??
              'biological',
            [isActiveVariable]: true,
          },
        });

        for (const [key, value] of Object.entries(result)) {
          if (!key.startsWith('partnership-')) continue;
          const parentId = key.replace('partnership-', '');
          if (value === 'current' || value === 'ex') {
            addEdge({
              from: newNodeId,
              to: parentId,
              attributes: {
                [relationshipTypeVariable]: 'partner',
                [isActiveVariable]: value === 'current',
              },
            });
          }
        }
        break;
      }
      case 'child': {
        addEdge({
          from: nodeId,
          to: newNodeId,
          attributes: {
            [relationshipTypeVariable]: 'biological',
            [isActiveVariable]: true,
          },
        });
        const partnerId = result.partnerId as string | undefined;
        if (partnerId) {
          addEdge({
            from: partnerId,
            to: newNodeId,
            attributes: {
              [relationshipTypeVariable]: 'biological',
              [isActiveVariable]: true,
            },
          });
        }
        break;
      }
      case 'partner': {
        addEdge({
          from: nodeId,
          to: newNodeId,
          attributes: {
            [relationshipTypeVariable]: 'partner',
            [isActiveVariable]: result.current !== 'ex',
          },
        });

        for (const [key, value] of Object.entries(result)) {
          if (!key.startsWith('parentType-')) continue;
          const childId = key.replace('parentType-', '');
          if (
            value === 'biological' ||
            value === 'social' ||
            value === 'donor' ||
            value === 'surrogate'
          ) {
            addEdge({
              from: newNodeId,
              to: childId,
              attributes: {
                [relationshipTypeVariable]: value,
                [isActiveVariable]: true,
              },
            });
          }
        }
        break;
      }
      case 'sibling': {
        const sharedParents = Array.isArray(result.sharedParents)
          ? new Set(result.sharedParents.map(String))
          : null;

        for (const edge of edges.values()) {
          const edgeRelType = edge.attributes[relationshipTypeVariable];
          if (edgeRelType !== 'partner' && edge.to === nodeId) {
            if (sharedParents && !sharedParents.has(edge.from)) continue;

            addEdge({
              from: edge.from,
              to: newNodeId,
              attributes: {
                [relationshipTypeVariable]: edgeRelType as string,
                [isActiveVariable]: true,
              },
            });
          }
        }
        break;
      }
    }
  };

  const handleEditName = async (nodeId: string) => {
    const currentNode = nodes.get(nodeId);
    const currentName =
      typeof currentNode?.attributes[nodeLabelVariable] === 'string'
        ? currentNode.attributes[nodeLabelVariable]
        : '';

    const result = await openDialog({
      type: 'form',
      title: 'Edit name',
      submitLabel: 'Done',
      cancelLabel: 'Cancel',
      children: (
        <Field
          name="name"
          label="Name"
          component={InputField}
          initialValue={currentName}
          hint="Leave blank if the name is not known"
          autoFocus
        />
      ),
    });

    if (!result) return;

    const name = typeof result.name === 'string' ? result.name : '';
    if (!currentNode) return;
    updateNode(nodeId, {
      ...currentNode.attributes,
      [nodeLabelVariable]: name,
    });
  };

  const handleAddChild = async (nodeId: string) => {
    const result = await openAddChildWizard(
      openDialog,
      nodeId,
      nodes,
      edges,
      variableConfig,
    );
    if (result) {
      commitBatch(result);
    }
  };

  const handleAddSibling = async (nodeId: string) => {
    const result = await openAddSiblingWizard(
      openDialog,
      nodeId,
      nodes,
      edges,
      variableConfig,
    );
    if (result) {
      commitBatch(result);
    }
  };

  const handleAddParent = async (nodeId: string) => {
    const bioParentCount = [...edges.values()].filter(
      (e) =>
        e.to === nodeId &&
        e.attributes[relationshipTypeVariable] !== 'partner' &&
        e.attributes[relationshipTypeVariable] !== 'social',
    ).length;

    const result =
      bioParentCount >= 2
        ? await openAddParentWizard(
            openDialog,
            nodeId,
            nodes,
            edges,
            variableConfig,
          )
        : await openDefineParentsWizard(
            openDialog,
            nodeId,
            nodes,
            edges,
            variableConfig,
          );

    if (result) {
      commitBatch(result);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    removeNode(nodeId);
  };

  const handleMenuAction = (nodeId: string, action: NodeContextMenuAction) => {
    if (action === 'editName') {
      void handleEditName(nodeId);
    } else if (action === 'child') {
      void handleAddChild(nodeId);
    } else if (action === 'sibling') {
      void handleAddSibling(nodeId);
    } else if (action === 'parent') {
      void handleAddParent(nodeId);
    } else if (action === 'delete') {
      handleDeleteNode(nodeId);
    } else {
      void handleAddPerson(nodeId, action);
    }
  };

  const egoId = useMemo(() => {
    for (const [id, node] of nodes) {
      if (node.attributes[egoVariable] === true) return id;
    }
    return null;
  }, [nodes, egoVariable]);

  const displayLabels = computeNodeDisplayLabels(nodes, edges, variableConfig);

  return (
    <div className="absolute inset-0 overflow-x-auto pt-6">
      {measurementContainer}
      <div className="relative flex min-h-full min-w-fit justify-center">
        <PedigreeLayout
          nodes={nodes}
          edges={edges}
          variableConfig={variableConfig}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
          renderNode={(node) => {
            const isEgo = node.attributes[egoVariable] === true;
            const isAdopted = [...edges.values()].some(
              (e) =>
                e.to === node.id &&
                e.attributes[relationshipTypeVariable] === 'adoptive',
            );

            return activeNominationVariable ? (
              <PedigreeNode
                node={node}
                isEgo={isEgo}
                displayLabel={displayLabels.get(node.id) ?? ''}
                allowDrag={false}
                isAdopted={isAdopted}
                selected={node.attributes[activeNominationVariable] === true}
                onClick={() =>
                  onToggleAttribute?.(node.id, activeNominationVariable)
                }
              />
            ) : (
              <NodeContextMenu
                canAddParent={
                  isEgo ||
                  ![...edges.values()].some(
                    (e) =>
                      e.attributes[relationshipTypeVariable] === 'partner' &&
                      (e.from === egoId || e.to === egoId) &&
                      (e.from === node.id || e.to === node.id),
                  )
                }
                canAddSibling={
                  isEgo ||
                  [...edges.values()].some(
                    (e) =>
                      e.to === node.id &&
                      e.attributes[relationshipTypeVariable] !== 'partner' &&
                      e.attributes[relationshipTypeVariable] !== 'social',
                  )
                }
                isEgo={isEgo}
                onAction={(action) => handleMenuAction(node.id, action)}
              >
                <PedigreeNode
                  node={node}
                  isEgo={isEgo}
                  displayLabel={displayLabels.get(node.id) ?? ''}
                  allowDrag={false}
                  isAdopted={isAdopted}
                />
              </NodeContextMenu>
            );
          }}
        />
      </div>
    </div>
  );
}
