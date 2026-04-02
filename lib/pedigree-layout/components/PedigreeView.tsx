'use client';

import { useSelector } from 'react-redux';
import Node from '~/components/Node';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';
import useDialog from '~/lib/dialogs/useDialog';
import Field from '~/lib/form/components/Field/Field';
import InputField from '~/lib/form/components/fields/InputField';
import AddPersonFields, {
  type AddPersonMode,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/AddPersonForm';
import { openAddChildWizard } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/AddChildWizard';
import { openAddParentWizard } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/AddParentWizard';
import { openAddSiblingWizard } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/AddSiblingWizard';
import { openDefineParentsWizard } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/DefineParentsWizard';
import { useFamilyPedigreeStore } from '~/lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigreeProvider';
import {
  type NodeData,
  type StoreEdge,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import {
  getIsActiveVariable,
  getIsGestationalCarrierVariable,
  getRelationshipTypeVariable,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/edgeUtils';
import {
  getEgoVariable,
  getNodeLabelVariable,
  getResolvedNodeFormFields,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';
import NodeContextMenu, {
  type NodeContextMenuAction,
} from '~/lib/pedigree-layout/components/NodeContextMenu';
import PedigreeLayout from '~/lib/pedigree-layout/components/PedigreeLayout';
import PedigreeNode, {
  computeNodeDisplayLabels,
} from '~/lib/pedigree-layout/components/PedigreeNode';
import { type ParentEdge } from '~/schemas/familyPedigree';

export default function PedigreeView() {
  const nodes = useFamilyPedigreeStore((s) => s.network.nodes);
  const edges = useFamilyPedigreeStore((s) => s.network.edges);
  const addNode = useFamilyPedigreeStore((s) => s.addNode);
  const addEdge = useFamilyPedigreeStore((s) => s.addEdge);
  const updateNode = useFamilyPedigreeStore((s) => s.updateNode);
  const removeNode = useFamilyPedigreeStore((s) => s.removeNode);
  const clearNetwork = useFamilyPedigreeStore((s) => s.clearNetwork);
  const commitBatch = useFamilyPedigreeStore((s) => s.commitBatch);

  const nodeLabelVariable = useSelector(getNodeLabelVariable);
  const egoVariable = useSelector(getEgoVariable);
  const relationshipTypeVariable = useSelector(getRelationshipTypeVariable);
  const isActiveVariable = useSelector(getIsActiveVariable);
  const isGestationalCarrierVariable = useSelector(
    getIsGestationalCarrierVariable,
  );
  const resolvedFormFields = useSelector(getResolvedNodeFormFields);

  const variableConfig: VariableConfig = {
    nodeLabelVariable,
    egoVariable,
    relationshipTypeVariable,
    isActiveVariable,
    isGestationalCarrierVariable,
  };

  const { openDialog } = useDialog();

  const { nodeWidth, nodeHeight } = useNodeMeasurement({
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
        />
      ),
    });

    if (!result) return;

    const name = typeof result.name === 'string' ? result.name : '';

    const formAttrs: Record<string, unknown> = {};
    for (const field of resolvedFormFields) {
      if (result[field.variableId] !== undefined) {
        formAttrs[field.variableId] = result[field.variableId];
      }
    }

    const newNodeId = addNode({
      isEgo: false,
      attributes: {
        [nodeLabelVariable]: name,
        ...formAttrs,
      },
    });

    switch (mode) {
      case 'parent': {
        addEdge({
          source: newNodeId,
          target: nodeId,
          relationshipType:
            (result.edgeType as ParentEdge['relationshipType'] | undefined) ??
            'biological',
          isActive: true,
        });

        // Create partner edges with existing parents if specified
        for (const [key, value] of Object.entries(result)) {
          if (!key.startsWith('partnership-')) continue;
          const parentId = key.replace('partnership-', '');
          if (value === 'current' || value === 'ex') {
            addEdge({
              source: newNodeId,
              target: parentId,
              relationshipType: 'partner',
              isActive: value === 'current',
            });
          }
        }
        break;
      }
      case 'child': {
        addEdge({
          source: nodeId,
          target: newNodeId,
          relationshipType: 'biological',
          isActive: true,
        });
        const partnerId = result.partnerId as string | undefined;
        if (partnerId) {
          addEdge({
            source: partnerId,
            target: newNodeId,
            relationshipType: 'biological',
            isActive: true,
          });
        }
        break;
      }
      case 'partner': {
        addEdge({
          source: nodeId,
          target: newNodeId,
          relationshipType: 'partner',
          isActive: result.current !== 'ex',
        });

        // Create parent edges to the anchor's children if specified
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
              source: newNodeId,
              target: childId,
              relationshipType: value,
              isActive: true,
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
          if (edge.relationshipType !== 'partner' && edge.target === nodeId) {
            // If sharedParents was specified, only copy edges for selected parents
            if (sharedParents && !sharedParents.has(edge.source)) continue;

            addEdge({
              source: edge.source,
              target: newNodeId,
              relationshipType: edge.relationshipType,
              isActive: true,
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
      attributes: { ...currentNode.attributes, [nodeLabelVariable]: name },
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
        e.target === nodeId &&
        e.relationshipType !== 'partner' &&
        e.relationshipType !== 'social',
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

  const displayLabels = computeNodeDisplayLabels(nodes, edges, variableConfig);

  return (
    <div className="relative size-full overflow-x-auto pt-6">
      <div className="relative flex size-full min-w-fit justify-center">
        <PedigreeLayout
          nodes={nodes}
          edges={edges}
          nodeLabelVariable={nodeLabelVariable}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
          renderNode={(node) => (
            <NodeContextMenu
              isBiological={
                node.isEgo ||
                [...edges.values()].some(
                  (e) =>
                    e.relationshipType !== 'partner' &&
                    (e.source === node.id || e.target === node.id),
                )
              }
              isEgo={node.isEgo}
              onAction={(action) => handleMenuAction(node.id, action)}
            >
              <PedigreeNode
                node={node}
                displayLabel={displayLabels.get(node.id) ?? ''}
                allowDrag={node.readOnly !== true}
              />
            </NodeContextMenu>
          )}
        />
      </div>
    </div>
  );
}
