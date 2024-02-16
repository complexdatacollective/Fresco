import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import UINode from '../Node';
import DragManager from '../../behaviours/DragAndDrop/DragManager';

const LayoutNode = ({
  node,
  portal,
  onSelected,
  onDragStart,
  onDragMove,
  onDragEnd,
  selected,
  inactive,
  linking,
  index,
}) => {
  const dragManager = useRef();

  useEffect(() => {
    const uuid = node[entityPrimaryKeyProperty];

    dragManager.current = new DragManager({
      el: portal,
      onDragStart: (data) => onDragStart(uuid, index, data, false),
      onDragMove: (data) => onDragMove(uuid, index, data, false),
      onDragEnd: (data) => onDragEnd(uuid, index, data, true),
    });

    return () => {
      if (dragManager.current) {
        dragManager.current.unmount();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal, onDragStart, onDragMove, onDragEnd, index]); // Can't include `nodes` here as it is mutated by the drag and drop system

  useEffect(() => {
    const handleSelected = () => onSelected(node);

    portal.addEventListener('click', handleSelected);

    return () => {
      portal.removeEventListener('click', handleSelected);
    };
  }, [onSelected, node, portal]);

  return ReactDOM.createPortal(
    <UINode
      {...node}
      selected={selected}
      linking={linking}
      inactive={inactive}
    />,
    portal,
  );
};

export default LayoutNode;
