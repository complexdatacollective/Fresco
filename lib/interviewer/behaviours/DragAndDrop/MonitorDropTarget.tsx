import React, { useEffect, useState } from 'react';
import store from './store';
import {
  type MonitorDropTargetProps,
  type MonitorDropTargetState,
} from './types';

export const useDropTargetMonitor = (
  targetId: string,
): MonitorDropTargetState => {
  const [state, setState] = useState<MonitorDropTargetState>({
    isOver: false,
    willAccept: false,
    source: null,
  });

  useEffect(() => {
    const updateState = () => {
      const currentState = store.getState();
      console.log('Current state:', currentState);

      const target = currentState.targets?.find((t) => t.id === targetId);

      setState({
        isOver: Boolean(target?.isOver),
        willAccept: Boolean(target?.willAccept),
        source: currentState.source ?? null,
      });
    };

    const unsubscribe = store.subscribe(updateState);
    updateState(); // call once immediately

    return () => unsubscribe();
  }, [targetId]);

  return state;
};

// Render prop component
export const MonitorDropTarget: React.FC<MonitorDropTargetProps> = ({
  targetId,
  children,
}) => {
  const state = useDropTargetMonitor(targetId);
  return <>{children(state)}</>;
};
