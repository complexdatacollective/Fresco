import { useSelector } from 'react-redux';
import Node from '~/components/Node';
import { useDragSource } from '~/lib/dnd';
import { type NodeData } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { getNodeColorSelector } from '~/lib/interviewer/selectors/session';

type FamilyTreeNodeProps = {
  node: NodeData & { id: string };
  allowDrag: boolean;
  selected?: boolean;
  onTap?: (nodeId: string) => void;
};

export default function FamilyTreeNode(props: FamilyTreeNodeProps) {
  const { node, allowDrag, selected, onTap } = props;

  const { id, label, sex } = node;
  const shape =
    sex === 'female' ? 'circle' : sex === 'intersex' ? 'diamond' : 'square';
  const displayLabel = label || 'Unnamed';

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
    <Node
      ref={dragProps.ref}
      onPointerDown={dragProps.onPointerDown}
      onKeyDown={dragProps.onKeyDown}
      style={{ ...nodeColor, ...dragProps.style } as React.CSSProperties}
      className="shrink-0"
      color="custom"
      size="sm"
      label={label || ''}
      ariaLabel={displayLabel}
      shape={shape}
      selected={selected}
      onClick={() => onTap?.(id)}
    />
  );
}
