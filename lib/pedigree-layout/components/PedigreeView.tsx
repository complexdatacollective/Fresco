'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import Node from '~/components/Node';
import useDialog from '~/lib/dialogs/useDialog';
import Field from '~/lib/form/components/Field/Field';
import InputField from '~/lib/form/components/fields/InputField';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';
import AddPersonFields, {
  type AddPersonMode,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/AddPersonForm';
import { useFamilyPedigreeStore } from '~/lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigreeProvider';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import {
  getBiologicalSexVariable,
  getEgoVariable,
  getNodeLabelVariable,
  getResolvedNodeFormFields,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';
import {
  getIsActiveVariable,
  getIsGestationalCarrierVariable,
  getRelationshipTypeVariable,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/edgeUtils';
import PedigreeNode, {
  computeNodeDisplayLabels,
} from '~/lib/pedigree-layout/components/PedigreeNode';
import NodeContextMenu, {
  type NodeContextMenuAction,
} from '~/lib/pedigree-layout/components/NodeContextMenu';
import PedigreeLayout from '~/lib/pedigree-layout/components/PedigreeLayout';
import { type ParentEdge } from '~/schemas/familyPedigree';

export default function PedigreeView() {
  const nodes = useFamilyPedigreeStore((s) => s.network.nodes);
  const edges = useFamilyPedigreeStore((s) => s.network.edges);
  const addNode = useFamilyPedigreeStore((s) => s.addNode);
  const addEdge = useFamilyPedigreeStore((s) => s.addEdge);
  const updateNode = useFamilyPedigreeStore((s) => s.updateNode);

  const nodeLabelVariable = useSelector(getNodeLabelVariable);
  const biologicalSexVariable = useSelector(getBiologicalSexVariable);
  const egoVariable = useSelector(getEgoVariable);
  const relationshipTypeVariable = useSelector(getRelationshipTypeVariable);
  const isActiveVariable = useSelector(getIsActiveVariable);
  const isGestationalCarrierVariable = useSelector(
    getIsGestationalCarrierVariable,
  );
  const resolvedFormFields = useSelector(getResolvedNodeFormFields);

  const variableConfig: VariableConfig = {
    nodeLabelVariable,
    biologicalSexVariable,
    egoVariable,
    relationshipTypeVariable,
    isActiveVariable,
    isGestationalCarrierVariable,
  };

  const [openMenuNodeId, setOpenMenuNodeId] = useState<string | null>(null);
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
    const biologicalSex =
      typeof result.biologicalSex === 'string'
        ? result.biologicalSex
        : undefined;

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
        [biologicalSexVariable]: biologicalSex,
        ...formAttrs,
      },
    });

    switch (mode) {
      case 'parent':
        addEdge({
          source: newNodeId,
          target: nodeId,
          relationshipType:
            (result.edgeType as ParentEdge['relationshipType'] | undefined) ??
            'biological',
          isActive: true,
        });
        break;
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
      case 'partner':
        addEdge({
          source: nodeId,
          target: newNodeId,
          relationshipType: 'partner',
          isActive: result.current !== 'ex',
        });
        break;
      case 'sibling':
        for (const edge of edges.values()) {
          if (edge.relationshipType !== 'partner' && edge.target === nodeId) {
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

  const handleMenuAction = (nodeId: string, action: NodeContextMenuAction) => {
    setOpenMenuNodeId(null);
    if (action === 'editName') {
      void handleEditName(nodeId);
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
          biologicalSexVariable={biologicalSexVariable}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
          renderNode={(node) => (
            <NodeContextMenu
              nodeId={node.id}
              edges={edges}
              open={openMenuNodeId === node.id}
              onOpenChange={(open) => setOpenMenuNodeId(open ? node.id : null)}
              onAction={(action) => handleMenuAction(node.id, action)}
            >
              <PedigreeNode
                node={node}
                displayLabel={displayLabels.get(node.id) ?? ''}
                allowDrag={node.readOnly !== true}
                onTap={(nodeId) => setOpenMenuNodeId(nodeId)}
              />
            </NodeContextMenu>
          )}
        />
      </div>
    </div>
  );
}
