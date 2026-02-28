import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useDragSource } from '~/lib/dnd';
import { MotionNode } from '~/lib/interviewer/components/Node';

type DrawerNodeProps = {
  node: NcNode;
  itemType?: string;
  onLayoutAnimationComplete?: () => void;
};

export default function DrawerNode({
  node,
  itemType = 'UNPOSITIONED_NODE',
  onLayoutAnimationComplete,
}: DrawerNodeProps) {
  const nodeId = node[entityPrimaryKeyProperty];
  const rawName = node[entityAttributesProperty].name;
  const name = typeof rawName === 'string' ? rawName : 'Node';

  const { dragProps } = useDragSource({
    type: itemType,
    metadata: { ...node, nodeId, id: nodeId },
    announcedName: name,
  });

  return (
    <MotionNode
      layout
      onLayoutAnimationComplete={onLayoutAnimationComplete}
      {...node}
      {...dragProps}
      size="sm"
    />
  );
}
