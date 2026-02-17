import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useDragSource } from '~/lib/dnd';
import Node from '~/lib/interviewer/components/Node';

type DrawerNodeProps = {
  node: NcNode;
};

export default function DrawerNode({ node }: DrawerNodeProps) {
  const nodeId = node[entityPrimaryKeyProperty];
  const rawName = node[entityAttributesProperty].name;
  const name = typeof rawName === 'string' ? rawName : 'Node';

  const { dragProps, isDragging } = useDragSource({
    type: 'UNPOSITIONED_NODE',
    metadata: { nodeId, nodeType: node.type, id: nodeId },
    announcedName: name,
  });

  return (
    <div {...dragProps} className={isDragging ? 'opacity-30' : ''}>
      <Node {...node} size="sm" />
    </div>
  );
}
