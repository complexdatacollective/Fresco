import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TransitionGroup } from 'react-transition-group';
import { getCSSVariableAsNumber } from '~/lib/ui/utils/CSSVariables';
import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import Node from './Node';
import { NO_SCROLL } from '../behaviours/DragAndDrop/DragManager';
import { DragSource } from '../behaviours/DragAndDrop';
import createSorter from '../utils/createSorter';
import { NodeTransition } from './NodeList';

const EnhancedNode = DragSource(Node);

const MultiNodeBucket = (props) => {
  const {
    nodes,
    listId,
    sortOrder,
    nodeColor,
    label,
    itemType,
  } = props;

  const [stagger, setStagger] = useState(true);
  const [exit, setExit] = useState(true);
  const [currentListId, setCurrentListId] = useState(null);
  const [sortedNodes, setSortedNodes] = useState([]);

  useEffect(() => {
    const sorter = createSorter(sortOrder); // Uses the new sortOrder via withPrompt
    const sorted = sorter(nodes);

    // On first run, just set the nodes.
    if (!currentListId) {
      setSortedNodes(sorted);
      setCurrentListId(listId);
      return;
    }

    // if we provided the same list id, update immediately without exit or
    // stagger animations.
    if (listId === currentListId) {
      setExit(false);
      setStagger(false);
      setSortedNodes(sorted);
      return;
    }

    // Otherwise, enable animations and update after a delay.
    setExit(true);
    setStagger(true);
    setSortedNodes([]);

    const refreshTimer = setTimeout(() => {
      setSortedNodes(sorted);
      setCurrentListId(listId);
    }, getCSSVariableAsNumber('--animation-duration-slow-ms'));

    // eslint-disable-next-line consistent-return
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [nodes, sortOrder, listId, currentListId]);

  return (
    <TransitionGroup
      className="node-list"
      exit={exit}
    >
      {
        sortedNodes.slice(0, 3).map((node, index) => (
          <NodeTransition
            key={`${node[entityPrimaryKeyProperty]}_${index}`}
            delay={stagger ? index * 0.05 : 0}
          >
            <EnhancedNode
              color={nodeColor}
              inactive={index !== 0}
              allowDrag={index === 0}
              label={`${label(node)}`}
              meta={() => ({ ...node, itemType })}
              scrollDirection={NO_SCROLL}
              {...node}
            />
          </NodeTransition>
        ))
      }
    </TransitionGroup>
  );
};

MultiNodeBucket.propTypes = {
  nodes: PropTypes.array,
  nodeColor: PropTypes.string,
  itemType: PropTypes.string,
  label: PropTypes.func,
  listId: PropTypes.string.isRequired,
  sortOrder: PropTypes.array,
};

MultiNodeBucket.defaultProps = {
  nodes: [],
  nodeColor: '',
  label: () => (''),
  itemType: 'NODE',
  sortOrder: [],
};

export default MultiNodeBucket;
