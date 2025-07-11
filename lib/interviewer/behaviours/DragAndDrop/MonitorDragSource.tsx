import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  type DragSource,
  type MonitorDragSourceProps,
  type MonitorDragSourceState,
} from './types';

export const useDragSourceMonitor = (): MonitorDragSourceState => {
  const [dragState, setDragState] = useState<MonitorDragSourceState>({
    isDragging: false,
    dragOffset: null,
    source: null,
  });

  const dragDropState = useSelector(
    (state: Record<string, unknown>) => state.dragAndDrop,
  ) as
    | {
        source: DragSource | null;
      }
    | undefined;

  useEffect(() => {
    const source = dragDropState?.source;

    setDragState({
      isDragging: !!source,
      dragOffset: source ? { x: source.x, y: source.y } : null,
      source: source ?? null,
    });
  }, [dragDropState]);

  return dragState;
};

// Render prop component
export const MonitorDragSource: React.FC<MonitorDragSourceProps> = ({
  children,
}) => {
  const state = useDragSourceMonitor();
  return <>{children(state)}</>;
};
