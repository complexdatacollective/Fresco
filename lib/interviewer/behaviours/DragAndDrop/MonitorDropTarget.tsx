import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { type MonitorDropTargetState, type MonitorDropTargetProps, type DragSource } from './types';

export const useDropTargetMonitor = (targetId: string): MonitorDropTargetState => {
  const [dropState, setDropState] = useState<MonitorDropTargetState>({
    isOver: false,
    willAccept: false,
    source: null,
  });

  const dragDropState = useSelector(
    (state: Record<string, unknown>) => state.dragAndDrop,
  ) as
    | {
        targets: {
          id: string;
          isOver?: boolean;
          willAccept?: boolean;
          [key: string]: unknown;
        }[];
        source: DragSource | null;
      }
    | undefined;

  useEffect(() => {
    const target = dragDropState?.targets?.find((t) => t.id === targetId);

    if (target) {
      setDropState({
        isOver: Boolean(target.isOver),
        willAccept: Boolean(target.willAccept),
        source: dragDropState?.source ?? null,
      });
    } else {
      setDropState({
        isOver: false,
        willAccept: false,
        source: dragDropState?.source ?? null,
      });
    }
  }, [dragDropState, targetId]);

  return dropState;
};

// Render prop component
export const MonitorDropTarget: React.FC<MonitorDropTargetProps> = ({ targetId, children }) => {
  const state = useDropTargetMonitor(targetId);
  return <>{children(state)}</>;
};


