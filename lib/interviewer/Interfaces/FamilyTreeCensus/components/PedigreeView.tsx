'use client';

import { useState } from 'react';
import Node from '~/components/Node';
import useDialog from '~/lib/dialogs/useDialog';
import Field from '~/lib/form/components/Field/Field';
import InputField from '~/lib/form/components/fields/InputField';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';
import FamilyTreeNode from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import NodeContextMenu, {
  type NodeContextMenuAction,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/NodeContextMenu';
import AddPersonFields, {
  type AddPersonMode,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/AddPersonForm';
import PedigreeLayout from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout';
import { useFamilyTreeStore } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import { type ParentEdgeType } from '~/lib/pedigree-layout/types';

export default function PedigreeView() {
  const nodes = useFamilyTreeStore((s) => s.network.nodes);
  const edges = useFamilyTreeStore((s) => s.network.edges);
  const addNode = useFamilyTreeStore((s) => s.addNode);
  const addEdge = useFamilyTreeStore((s) => s.addEdge);
  const updateNode = useFamilyTreeStore((s) => s.updateNode);

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
    const newNodeId = addNode({ label: name, isEgo: false });

    switch (mode) {
      case 'parent':
        addEdge({
          source: newNodeId,
          target: nodeId,
          type: 'parent',
          edgeType: (result.edgeType as ParentEdgeType | undefined) ?? 'parent',
        });
        break;
      case 'child': {
        addEdge({
          source: nodeId,
          target: newNodeId,
          type: 'parent',
          edgeType: 'parent',
        });
        const partnerId = result.partnerId as string | undefined;
        if (partnerId) {
          addEdge({
            source: partnerId,
            target: newNodeId,
            type: 'parent',
            edgeType: 'parent',
          });
        }
        break;
      }
      case 'partner':
        addEdge({
          source: nodeId,
          target: newNodeId,
          type: 'partner',
          active: result.current !== 'ex',
        });
        break;
      case 'sibling':
        for (const edge of edges.values()) {
          if (edge.type === 'parent' && edge.target === nodeId) {
            addEdge({
              source: edge.source,
              target: newNodeId,
              type: 'parent',
              edgeType: edge.edgeType,
            });
          }
        }
        break;
    }
  };

  const handleEditName = async (nodeId: string) => {
    const currentName = nodes.get(nodeId)?.label ?? '';

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
    updateNode(nodeId, { label: name });
  };

  const handleMenuAction = (nodeId: string, action: NodeContextMenuAction) => {
    setOpenMenuNodeId(null);
    if (action === 'editName') {
      void handleEditName(nodeId);
    } else {
      void handleAddPerson(nodeId, action);
    }
  };

  return (
    <div className="census-node-canvas relative size-full overflow-x-auto pt-6">
      <div className="relative flex size-full min-w-fit justify-center">
        <PedigreeLayout
          nodes={nodes}
          edges={edges}
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
              <FamilyTreeNode
                node={node}
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
