import React, { useEffect, useState } from 'react';
import store from './store';
import {
  type DragSource,
  type MonitorDragSourceProps,
  type MonitorDragSourceState,
} from './types';

export const useDragSourceMonitor = (): MonitorDragSourceState => {
  const [state, setState] = useState<MonitorDragSourceState>({
    isDragging: false,
    dragOffset: null,
    source: null,
  });

  useEffect(() => {
    const updateState = () => {
      const currentState = store.getState();
      const source = currentState.source as DragSource | null;

      setState({
        isDragging: !!source,
        dragOffset: source ? { x: source.x, y: source.y } : null,
        source: source ?? null,
      });
    };

    const unsubscribe = store.subscribe(updateState);
    updateState(); // initial call

    return () => unsubscribe();
  }, []);

  return state;
};

// Render prop component
export const MonitorDragSource: React.FC<MonitorDragSourceProps> = ({
  children,
}) => {
  const dragState = useDragSourceMonitor();
  return <>{children(dragState)}</>;
};
