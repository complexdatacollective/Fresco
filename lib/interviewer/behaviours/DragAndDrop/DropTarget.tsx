import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  const updateTarget = useCallback(() => {
    const element = validateElementRef(elementRef, 'useDropTarget');
    if (!element) return;

    const boundingRect = getAbsoluteBoundingRect(element);
    if (!boundingRect) return;

    const bounds: Bounds = {
      x: boundingRect.left,
      y: boundingRect.top,
      width: boundingRect.width,
      height: boundingRect.height,
    };

    setState((prev) => ({ ...prev, bounds }));

    store.dispatch(
      actions.upsertTarget({
        id,
        onDrop,
        onDrag,
        onDragEnd,
        accepts,
        meta: meta?.() ?? {},
        width: bounds.width,
        height: bounds.height,
        y: bounds.y,
        x: bounds.x,
      }),
    );
  }, [id, onDrop, onDrag, onDragEnd, accepts, meta]);

  const removeTarget = useCallback(() => {
    store.dispatch(actions.removeTarget(id));
  }, [id]);

  // Use ResizeObserver + IntersectionObserver only - NO POLLING
  useEffect(() => {
    const element = validateElementRef(elementRef, 'useDropTarget');
    if (!element) return;

    updateTarget();

    const resizeObserver = new ResizeObserver(updateTarget);
    const intersectionObserver = new IntersectionObserver(updateTarget);

    resizeObserver.observe(element);
    intersectionObserver.observe(element);

    return () => {
      removeTarget();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [updateTarget, removeTarget]);

  return { elementRef, state };
};

// Render prop component
export const DropTarget: React.FC<DropTargetProps> = ({ children, ...props }) => {
  const { elementRef, state } = useDropTarget(props);
  return <>{children(elementRef, state)}</>;
};

