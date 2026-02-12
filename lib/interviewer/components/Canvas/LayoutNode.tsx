'use client';

import { type NcNode, entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import DragManager, {
  NO_SCROLL,
} from '../../behaviours/DragAndDrop/DragManager';
import UINode from '../Node';

type LayoutNodeProps = {
  node: NcNode;
  portal: HTMLDivElement;
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelected: (node: any) => void;
  onDragStart: (
    uuid: string,
    index: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    flag: boolean,
  ) => void;
  onDragMove: (
    uuid: string,
    index: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    flag: boolean,
  ) => void;
  onDragEnd: (
    uuid: string,
    index: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    flag: boolean,
  ) => void;
  selected: boolean;
  inactive: boolean;
  linking: boolean;
  allowPositioning?: boolean;
  allowSelect?: boolean;
};

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
}: LayoutNodeProps) => {
  const dragManager = useRef<InstanceType<typeof DragManager> | null>(null);

  useEffect(() => {
    const uuid = node[entityPrimaryKeyProperty];

    dragManager.current = new DragManager({
      el: portal,
      onDragStart: (data: { x: number; y: number }) =>
        onDragStart(uuid, index, data, false),
      onDragMove: (data: { x: number; y: number }) =>
        onDragMove(uuid, index, data, false),
      onDragEnd: (data: { x: number; y: number }) =>
        onDragEnd(uuid, index, data, true),
      scrollDirection: NO_SCROLL,
    });

    return () => {
      if (dragManager.current) {
        dragManager.current.unmount();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal, onDragStart, onDragMove, onDragEnd, index]);

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
      disabled={inactive}
      size="sm"
    />,
    portal,
  );
};

export default LayoutNode;
