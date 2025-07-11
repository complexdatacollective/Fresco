import React, { useCallback, useEffect, useRef } from 'react';
import { validateElementRef } from './utils/domValidation';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import { actionCreators as actions } from './reducer';
import store from './store';
import { type DropObstacleProps, type Bounds } from './types';

export const useDropObstacle = (id: string) => {
  const elementRef = useRef<HTMLElement>(null);

  const updateObstacle = useCallback(() => {
    const element = validateElementRef(elementRef, 'useDropObstacle');
    if (!element) return;

    const boundingRect = getAbsoluteBoundingRect(element);
    if (!boundingRect) return;

    const bounds: Bounds = {
      x: boundingRect.left,
      y: boundingRect.top,
      width: boundingRect.width,
      height: boundingRect.height,
    };

    store.dispatch(
      actions.upsertObstacle({
        id,
        width: bounds.width,
        height: bounds.height,
        y: bounds.y,
        x: bounds.x,
      }),
    );
  }, [id]);

  const removeObstacle = useCallback(() => {
    store.dispatch(actions.removeObstacle(id));
  }, [id]);

  // Use ResizeObserver + IntersectionObserver only - NO POLLING
  useEffect(() => {
    const element = validateElementRef(elementRef, 'useDropObstacle');
    if (!element) return;

    updateObstacle();

    const resizeObserver = new ResizeObserver(updateObstacle);
    const intersectionObserver = new IntersectionObserver(updateObstacle);

    resizeObserver.observe(element);
    intersectionObserver.observe(element);

    return () => {
      removeObstacle();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [updateObstacle, removeObstacle]);

  return { elementRef };
};

// Render prop component
export const DropObstacle: React.FC<DropObstacleProps> = ({ children, id }) => {
  const { elementRef } = useDropObstacle(id);
  return <>{children(elementRef)}</>;
};

