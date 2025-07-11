import React, { useEffect, useRef, useState } from 'react';
import { validateElementRef } from './utils/domValidation';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import { actionCreators as actions } from './reducer';
import store from './store';
import { type DropTargetProps, type DropTargetState, type Bounds } from './types';

export const useDropTarget = (props: Omit<DropTargetProps, 'children'>) => {
  const { id, onDrop, onDrag, onDragEnd, accepts, meta } = props;
  const elementRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<DropTargetState>({
    isOver: false,
    willAccept: false,
    bounds: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Use refs to store latest values and avoid re-running effect when props change
  const propsRef = useRef({ onDrop, onDrag, onDragEnd, accepts, meta });
  propsRef.current = { onDrop, onDrag, onDragEnd, accepts, meta };

  // Use ResizeObserver + IntersectionObserver only - NO POLLING
  useEffect(() => {
    const element = validateElementRef(elementRef, 'useDropTarget');
    if (!element) return;

    const updateTargetHandler = () => {
      const boundingRect = getAbsoluteBoundingRect(element);
      if (!boundingRect) return;

      const bounds: Bounds = {
        x: boundingRect.left,
        y: boundingRect.top,
        width: boundingRect.width,
        height: boundingRect.height,
      };

      setState((prev) => ({ ...prev, bounds }));

      const currentProps = propsRef.current;
      store.dispatch(
        actions.upsertTarget({
          id,
          onDrop: currentProps.onDrop,
          onDrag: currentProps.onDrag,
          onDragEnd: currentProps.onDragEnd,
          accepts: currentProps.accepts,
          meta: currentProps.meta?.() ?? {},
          width: bounds.width,
          height: bounds.height,
          y: bounds.y,
          x: bounds.x,
        }),
      );
    };

    updateTargetHandler();

    const resizeObserver = new ResizeObserver(updateTargetHandler);
    const intersectionObserver = new IntersectionObserver(updateTargetHandler);

    resizeObserver.observe(element);
    intersectionObserver.observe(element);

    return () => {
      store.dispatch(actions.removeTarget(id));
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [id]);

  return { elementRef, state };
};

// Render prop component
export const DropTarget: React.FC<DropTargetProps> = ({ children, ...props }) => {
  const { elementRef, state } = useDropTarget(props);
  return <>{children(elementRef, state)}</>;
};

