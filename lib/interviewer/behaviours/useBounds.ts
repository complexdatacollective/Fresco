import { isEqual } from 'es-toolkit';
import { type RefObject, useEffect, useRef, useState } from 'react';
import getAbsoluteBoundingRect from '../utils/getAbsoluteBoundingRect';

type Bounds = {
  width: number;
  height: number;
  y: number;
  x: number;
};

const initialBounds: Bounds = {
  width: 0,
  height: 0,
  y: 0,
  x: 0,
};

export default function useBounds(ref: RefObject<HTMLDivElement | null>) {
  const [bounds, setBounds] = useState<Bounds>(initialBounds);
  const lastBoundsRef = useRef<Bounds>(initialBounds);

  useEffect(() => {
    const node = ref.current?.firstElementChild;
    if (!node) {
      return;
    }

    const measure = () => {
      const el = ref.current?.firstElementChild;
      if (!el) {
        return;
      }

      const boundingClientRect = getAbsoluteBoundingRect(el as HTMLElement) as {
        width: number;
        height: number;
        top: number;
        left: number;
      };
      if (!boundingClientRect) return;

      const nextBounds: Bounds = {
        width: boundingClientRect.width,
        height: boundingClientRect.height,
        y: boundingClientRect.top,
        x: boundingClientRect.left,
      };

      if (!isEqual(lastBoundsRef.current, nextBounds)) {
        lastBoundsRef.current = nextBounds;
        setBounds(nextBounds);
      }
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(node);

    return () => {
      observer.unobserve(node);
      observer.disconnect();
    };
  }, [ref]);

  return bounds;
}
