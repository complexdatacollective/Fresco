import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import Node from './Node';
import { NO_SCROLL } from '../behaviours/DragAndDrop/DragManager';
import { DragSource } from '../behaviours/DragAndDrop';
import createSorter from '../utils/createSorter';
import { NodeTransition } from './NodeList';
import { AnimatePresence, motion } from 'framer-motion';
import useReadyForNextStage from '../hooks/useReadyForNextStage';

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
    }
  }, [sortedNodes.length, updateReady]);

  return (
    <motion.div layout className="node-list">
      <AnimatePresence mode="sync">
        {sortedNodes.length === 0 && (<div className='h-full flex items-center justify-center'>No items to place</div>)}
        {sortedNodes.slice(0, 3).map((node, index) => (
          <NodeTransition
            key={`${node[entityPrimaryKeyProperty]}_${index}`}
            delay={stagger ? index * 0.05 : 0}
          >
            <EnhancedNode
              inactive={index !== 0}
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
