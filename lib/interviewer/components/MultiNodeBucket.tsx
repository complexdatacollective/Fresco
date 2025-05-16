import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { isEqual } from 'es-toolkit';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useEffect, useMemo, useState } from 'react';
import { DragSource } from '../behaviours/DragAndDrop';
import { NO_SCROLL } from '../behaviours/DragAndDrop/DragManager';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import createSorter, { type ProcessedSortRule } from '../utils/createSorter';
import Node from './Node';
import { NodeTransition } from './NodeList';

const EnhancedNode = DragSource(Node);

type MultiNodeBucketProps = {
  nodes: NcNode[];
  itemType?: string;
  listId: string;
  sortOrder?: ProcessedSortRule[];
};

const MultiNodeBucket = memo(
  (props: MultiNodeBucketProps) => {
    const { nodes = [], sortOrder = [], itemType = 'NODE' } = props;

    const [stagger] = useState(true);

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
      <motion.div layout className="node-list">
        <AnimatePresence mode="sync">
          {sortedNodes.length === 0 && (
            <div className="flex h-full items-center justify-center">
              No items to place. Click the down arrow to continue.
            </div>
          )}
          {sortedNodes.slice(0, 1).map((node, index) => (
            <NodeTransition
              key={`${node[entityPrimaryKeyProperty]}_${index}`}
              delay={stagger ? index * 0.05 : 0}
            >
              <EnhancedNode
                allowDrag={index === 0}
                meta={() => ({ ...node, itemType })}
                scrollDirection={NO_SCROLL}
                {...node}
              />
            </NodeTransition>
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
