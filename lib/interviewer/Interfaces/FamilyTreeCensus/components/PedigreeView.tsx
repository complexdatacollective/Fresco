'use client';

import { useState } from 'react';
import Node from '~/components/Node';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';
import FamilyTreeNode from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import NodeContextMenu from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/NodeContextMenu';
import AddPersonForm, {
  type AddPersonMode,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/AddPersonForm';
import NameInput from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/NameInput';
import PedigreeLayout from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout';
import { useFamilyTreeStore } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import { Button } from '~/components/ui/Button';
import { type ParentEdgeType } from '~/lib/pedigree-layout/types';

type InteractionState =
  | { mode: 'idle' }
  | {
      mode: 'contextMenu';
      nodeId: string;
      position: { x: number; y: number };
    }
  | {
      mode: 'addPerson';
      nodeId: string;
      addMode: AddPersonMode;
    }
  | {
      mode: 'editName';
      nodeId: string;
    };

export default function PedigreeView() {
  const nodes = useFamilyTreeStore((s) => s.network.nodes);
  const edges = useFamilyTreeStore((s) => s.network.edges);
  const addNode = useFamilyTreeStore((s) => s.addNode);
  const addEdge = useFamilyTreeStore((s) => s.addEdge);
  const updateNode = useFamilyTreeStore((s) => s.updateNode);

  const [interaction, setInteraction] = useState<InteractionState>({
    mode: 'idle',
  });

  const { nodeWidth, nodeHeight } = useNodeMeasurement({
    component: <Node size="sm" />,
  });

  const handleNodeTap = (nodeId: string, position: { x: number; y: number }) =>
    setInteraction({ mode: 'contextMenu', nodeId, position });

  const dismiss = () => setInteraction({ mode: 'idle' });

  const handleAddPersonSubmit = (
    anchorId: string,
    data: {
      name: string;
      mode: AddPersonMode;
      edgeType?: ParentEdgeType;
      partnerId?: string;
      current?: boolean;
    },
  ) => {
    const newNodeId = addNode({ label: data.name, isEgo: false });

    switch (data.mode) {
      case 'parent':
        addEdge({
          source: newNodeId,
          target: anchorId,
          type: 'parent',
          edgeType: data.edgeType ?? 'social-parent',
        });
        break;
      case 'child':
        addEdge({
          source: anchorId,
          target: newNodeId,
          type: 'parent',
          edgeType: 'social-parent',
        });
        if (data.partnerId) {
          addEdge({
            source: data.partnerId,
            target: newNodeId,
            type: 'parent',
            edgeType: 'social-parent',
          });
        }
        break;
      case 'partner':
        addEdge({
          source: anchorId,
          target: newNodeId,
          type: 'partner',
          current: data.current ?? true,
        });
        break;
      case 'sibling': {
        for (const edge of edges.values()) {
          if (edge.type === 'parent' && edge.target === anchorId) {
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
    }

    dismiss();
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
            <FamilyTreeNode
              node={node}
              allowDrag={node.readOnly !== true}
              onTap={handleNodeTap}
            />
          )}
        />
      </div>

      {interaction.mode === 'contextMenu' && (
        <NodeContextMenu
          nodeId={interaction.nodeId}
          node={nodes.get(interaction.nodeId)!}
          position={interaction.position}
          edges={edges}
          onAddParent={() =>
            setInteraction({
              mode: 'addPerson',
              nodeId: interaction.nodeId,
              addMode: 'parent',
            })
          }
          onAddChild={() =>
            setInteraction({
              mode: 'addPerson',
              nodeId: interaction.nodeId,
              addMode: 'child',
            })
          }
          onAddPartner={() =>
            setInteraction({
              mode: 'addPerson',
              nodeId: interaction.nodeId,
              addMode: 'partner',
            })
          }
          onAddSibling={() =>
            setInteraction({
              mode: 'addPerson',
              nodeId: interaction.nodeId,
              addMode: 'sibling',
            })
          }
          onEditName={() =>
            setInteraction({
              mode: 'editName',
              nodeId: interaction.nodeId,
            })
          }
          onClose={dismiss}
        />
      )}

      {interaction.mode === 'addPerson' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-lg bg-white shadow-xl">
            <AddPersonForm
              mode={interaction.addMode}
              anchorNodeId={interaction.nodeId}
              nodes={nodes}
              edges={edges}
              onSubmit={(data) =>
                handleAddPersonSubmit(interaction.nodeId, data)
              }
              onCancel={dismiss}
            />
          </div>
        </div>
      )}

      {interaction.mode === 'editName' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-xl">
            <h3 className="text-lg font-semibold">Edit name</h3>
            <NameInput
              value={nodes.get(interaction.nodeId)?.label ?? ''}
              onChange={(value) =>
                updateNode(interaction.nodeId, { label: value })
              }
            />
            <Button onClick={dismiss} color="primary">
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
