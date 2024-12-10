import { AnimatePresence, motion } from 'motion/react';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { entityPrimaryKeyProperty } from '~/lib/shared-consts';
import { DragSource } from '../behaviours/DragAndDrop';
import { NO_SCROLL } from '../behaviours/DragAndDrop/DragManager';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import createSorter from '../utils/createSorter';
import Node from './Node';
import { NodeTransition } from './NodeList';

const EnhancedNode = DragSource(Node);

const MultiNodeBucket = (props) => {
  const {
    nodes = [],
    listId,
    sortOrder = [],
    label = () => '',
    itemType = 'NODE',
  } = props;

  const [stagger] = useState(true);
  const [sortedNodes, setSortedNodes] = useState([]);

  useEffect(() => {
    const sorter = createSorter(sortOrder); // Uses the new sortOrder via withPrompt
    const sorted = sorter(nodes);
    setSortedNodes(sorted);
  }, [nodes, sortOrder, listId]);

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
              label={`${label(node)}`}
              meta={() => ({ ...node, itemType })}
              scrollDirection={NO_SCROLL}
              {...node}
            />
          </NodeTransition>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

MultiNodeBucket.propTypes = {
  nodes: PropTypes.array,
  itemType: PropTypes.string,
  label: PropTypes.func,
  listId: PropTypes.string.isRequired,
  sortOrder: PropTypes.array,
};

export default MultiNodeBucket;
