'use client';

import { Button } from '~/components/ui/Button';
import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

type NodeContextMenuProps = {
  nodeId: string;
  node: NodeData;
  position: { x: number; y: number };
  edges: Map<string, StoreEdge>;
  onAddParent: () => void;
  onAddChild: () => void;
  onAddPartner: () => void;
  onAddSibling: () => void;
  onEditName: () => void;
  onClose: () => void;
};

export default function NodeContextMenu({
  nodeId,
  node: _node,
  position,
  edges,
  onAddParent,
  onAddChild,
  onAddPartner,
  onAddSibling,
  onEditName,
  onClose,
}: NodeContextMenuProps) {
  const hasParents = [...edges.values()].some(
    (edge) => edge.type === 'parent' && edge.target === nodeId,
  );

  return (
    <div
      className="absolute z-50 flex flex-col gap-1 rounded-lg bg-white p-2 shadow-lg"
      style={{ left: position.x, top: position.y }}
    >
      <Button variant="text" size="sm" onClick={onAddParent}>
        Add parent
      </Button>
      <Button variant="text" size="sm" onClick={onAddChild}>
        Add child
      </Button>
      <Button variant="text" size="sm" onClick={onAddPartner}>
        Add partner
      </Button>
      {hasParents && (
        <Button variant="text" size="sm" onClick={onAddSibling}>
          Add sibling
        </Button>
      )}
      <Button variant="text" size="sm" onClick={onEditName}>
        Edit name
      </Button>
      <Button variant="text" size="sm" onClick={onClose}>
        Cancel
      </Button>
    </div>
  );
}
