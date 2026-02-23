import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { isEqual } from 'es-toolkit';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useEffect, useMemo } from 'react';
import { useDragSource } from '~/lib/dnd';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import createSorter, { type ProcessedSortRule } from '../utils/createSorter';
import Node from './Node';

// Draggable wrapper for Node component
const DraggableNode = memo(
  ({
    node,
    itemType,
    allowDrag,
    ...nodeProps
  }: {
    node: NcNode;
    itemType: string;
    allowDrag: boolean;
    [key: string]: unknown;
  }) => {
    const { dragProps } = useDragSource({
      type: itemType,
      metadata: { ...node, itemType },
      announcedName: `Node ${node.type}`,
      disabled: !allowDrag,
    });

    return <Node {...node} {...nodeProps} {...dragProps} />;
  },
);

DraggableNode.displayName = 'DraggableNode';

type MultiNodeBucketProps = {
  nodes: NcNode[];
  itemType?: string;
  listId: string;
  sortOrder?: ProcessedSortRule[];
  nodeSize?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
};

const MultiNodeBucket = memo(
  (props: MultiNodeBucketProps) => {
    const { nodes = [], sortOrder = [], itemType = 'NODE', nodeSize } = props;

    const sorter = useMemo(() => createSorter<NcNode>(sortOrder), [sortOrder]);
    const sortedNodes = sorter(nodes);

    // Set the ready to advance state when there are no items left in the bucket
    const { updateReady } = useReadyForNextStage();

    useEffect(() => {
      updateReady(sortedNodes.length === 0);

      return () => {
        updateReady(false);
      };
    }, [sortedNodes.length, updateReady]);

    return (
      <motion.div layout>
        <AnimatePresence mode="wait">
          {sortedNodes.length === 0 && (
            <div className="flex h-full items-center justify-center">
              No items to place. Click the next arrow to continue.
            </div>
          )}
          {sortedNodes.slice(0, 1).map((node, index) => (
            <DraggableNode
              key={node[entityPrimaryKeyProperty]}
              node={node}
              itemType={itemType}
              allowDrag={index === 0}
              size={nodeSize}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // Deep equals on nodes
    if (isEqual(prevProps.nodes, nextProps.nodes)) {
      return true;
    }

    return false;
  },
);

MultiNodeBucket.displayName = 'MultiNodeBucket';

export default MultiNodeBucket;
