import { useCallback, useEffect, useRef, useState } from 'react';
import { isEqual } from 'es-toolkit';
import { validateElementRef } from '../DragAndDrop/utils/domValidation';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';

type Bounds = {
  width: number;
  height: number;
  x: number;
  y: number;
};

const initialBounds: Bounds = {
  width: 0,
  height: 0,
  y: 0,
  x: 0,
};

export const useBounds = <T extends HTMLElement = HTMLElement>(
  elementRef: React.RefObject<T>,
): Bounds => {
  const [bounds, setBounds] = useState<Bounds>(initialBounds);
  const lastBounds = useRef<Bounds>(initialBounds);
  const observer = useRef<ResizeObserver | null>(null);

  const measure = useCallback(() => {
    const element = validateElementRef(elementRef, 'useBounds');
    if (!element) return;

    const boundingClientRect = getAbsoluteBoundingRect(element);
    if (!boundingClientRect) return;

    const nextBounds: Bounds = {
      width: boundingClientRect.width,
      height: boundingClientRect.height,
      y: boundingClientRect.top,
      x: boundingClientRect.left,
    };

    if (!isEqual(lastBounds.current, nextBounds)) {
      lastBounds.current = nextBounds;
      setBounds(nextBounds);
    }
  }, [elementRef]);

  useEffect(() => {
    const element = validateElementRef(elementRef, 'useBounds');
    if (!element) return;

    // Initial measurement
    measure();

    // Set up ResizeObserver
    observer.current = new ResizeObserver(measure);
    observer.current.observe(element);

    return () => {
      if (observer.current && element) {
        observer.current.unobserve(element);
        observer.current.disconnect();
      }
    };
  }, [elementRef, measure]);

  return bounds;
};
