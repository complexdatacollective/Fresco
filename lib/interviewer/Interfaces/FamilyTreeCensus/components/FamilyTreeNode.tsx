import { useSelector } from 'react-redux';
import Node from '~/components/Node';
import { useDragSource } from '~/lib/dnd';
import { useFamilyTreeStore } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { getNodeColorSelector } from '~/lib/interviewer/selectors/session';

function EgoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 139.8 167.5"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fill="var(--color-platinum)"
        d="M69.9,0C46.1,0,26.8,21.4,26.8,47.8c-0.1,11.6,3.8,22.9,11.1,32l64-64C94,6.1,82.6,0,69.9,0z"
      />
      <path
        fill="var(--color-platinum-dark)"
        d="M37.9,79.8c7.9,9.7,19.3,15.8,32,15.8c23.8,0,43.1-21.4,43.1-47.8c0.1-11.6-3.8-22.9-11.1-32L37.9,79.8z"
      />
      <path
        fill="var(--color-platinum-dark)"
        d="M94,103.4c-4.1,0-13.6-7.5-10.9-11.3H56.6c2.7,3.8-6.8,11.3-10.9,11.3l24.2,10.8L94,103.4z"
      />
      <path
        fill="var(--color-platinum)"
        d="M100.3,105.3l-58.6,58.6C26.5,160,12.3,152.8,0,143c9.2-20.1,27.7-35.5,50.2-41.3c5.9,3.8,12.7,5.8,19.7,5.9c7-0.1,13.8-2.1,19.7-5.9C93.3,102.7,96.8,103.9,100.3,105.3z"
      />
      <path
        fill="var(--color-platinum-dark)"
        d="M139.8,143c-27.6,22-63.9,29.8-98.1,20.9l58.6-58.6C117.8,112.5,131.9,125.9,139.8,143z"
      />
    </svg>
  );
}

function getRelationshipToEgo(
  nodeId: string,
  egoId: string | undefined,
  nodes: Map<string, NodeData>,
  edges: Map<string, StoreEdge>,
): string | undefined {
  if (!egoId || nodeId === egoId) return undefined;

  for (const edge of edges.values()) {
    if (edge.type === 'partner') {
      if (
        (edge.source === nodeId && edge.target === egoId) ||
        (edge.source === egoId && edge.target === nodeId)
      ) {
        return 'Partner';
      }
      continue;
    }

    // Parent of ego
    if (edge.source === nodeId && edge.target === egoId) {
      return 'Parent';
    }

    // Child of ego
    if (edge.source === egoId && edge.target === nodeId) {
      return 'Child';
    }
  }

  // Check if sibling (shares a parent with ego)
  const egoParents = new Set<string>();
  const nodeParents = new Set<string>();
  for (const edge of edges.values()) {
    if (edge.type !== 'parent') continue;
    if (edge.target === egoId) egoParents.add(edge.source);
    if (edge.target === nodeId) nodeParents.add(edge.source);
  }

  for (const p of egoParents) {
    if (nodeParents.has(p)) return 'Sibling';
  }

  // Check if grandparent (parent of ego's parent)
  for (const parentId of egoParents) {
    for (const edge of edges.values()) {
      if (
        edge.type === 'parent' &&
        edge.source === nodeId &&
        edge.target === parentId
      ) {
        return 'Grandparent';
      }
    }
  }

  return undefined;
}

type FamilyTreeNodeProps = {
  node: NodeData & { id: string };
  allowDrag: boolean;
  selected?: boolean;
  onTap?: (nodeId: string) => void;
};

export default function FamilyTreeNode(props: FamilyTreeNodeProps) {
  const { node, allowDrag, selected, onTap } = props;

  const { id, label, isEgo, sex } = node;
  const shape =
    sex === 'female' ? 'circle' : sex === 'intersex' ? 'diamond' : 'square';

  const nodes = useFamilyTreeStore((s) => s.network.nodes);
  const edges = useFamilyTreeStore((s) => s.network.edges);

  const egoId = [...nodes.entries()].find(([, n]) => n.isEgo)?.[0];
  const relationshipLabel = getRelationshipToEgo(id, egoId, nodes, edges);
  const displayLabel = isEgo
    ? 'You'
    : label
      ? label
      : (relationshipLabel ?? 'Unnamed');

  const nodeTypeColor = useSelector(getNodeColorSelector);
  const n = /\d+$/.exec(nodeTypeColor)?.[0] ?? '1';
  const nodeColor = { '--base': `var(--color-node-${n})` };

  const { dragProps } = useDragSource({
    type: 'FAMILY_TREE_NODE',
    metadata: { itemType: 'FAMILY_TREE_NODE', placeholderId: id },
    announcedName: displayLabel,
    disabled: !allowDrag,
  });

  return (
    <div
      className="flex flex-col items-center gap-1 text-center"
      onClick={() => onTap?.(id)}
    >
      <span className="invisible max-w-24 truncate text-xs">
        {displayLabel}
      </span>
      <Node
        ref={dragProps.ref}
        onPointerDown={dragProps.onPointerDown}
        onKeyDown={dragProps.onKeyDown}
        style={{ ...nodeColor, ...dragProps.style } as React.CSSProperties}
        className="shrink-0"
        color="custom"
        size="sm"
        label={isEgo ? '' : (label ?? '')}
        ariaLabel={displayLabel}
        shape={shape}
        selected={selected}
      >
        {isEgo && (
          <EgoIcon className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-1/2" />
        )}
      </Node>
      <span className="max-w-24 truncate text-xs text-white">
        {displayLabel}
      </span>
    </div>
  );
}

export function FamilyTreeNodeMeasurement() {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="invisible text-xs">placeholder</span>
      <Node size="sm" />
      <span className="text-xs text-white">placeholder</span>
    </div>
  );
}
