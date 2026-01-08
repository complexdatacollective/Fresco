'use client';

import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import { type Layout } from '../layout/Layout';
import { type Size } from '../layout/types';
import { type Collection } from '../types';

export type UseLayoutManagerOptions<T> = {
  layout: Layout<T>;
  collection: Collection<T>;
  scrollRef: RefObject<HTMLElement | null>;
};

export type UseLayoutManagerResult = {
  /** Current container width in pixels */
  containerWidth: number;
  /** Content size from layout (width and height) */
  contentSize: Size;
  /** Version string that changes when layout is recalculated */
  layoutVersion: string;
};

/**
 * Hook that manages layout updates and container resize observation.
 * Updates the layout synchronously before render to ensure fresh layout info.
 *
 * @param options - Layout, collection, and scroll container ref
 * @returns Layout manager result with container dimensions and content size
 */
export function useLayoutManager<T>(
  options: UseLayoutManagerOptions<T>,
): UseLayoutManagerResult {
  const { layout, collection, scrollRef } = options;
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  // Track the scroll element - this handles HMR and ref changes properly
  useLayoutEffect(() => {
    setScrollElement(scrollRef.current);
  });

  // Observe container resize
  useLayoutEffect(() => {
    if (!scrollElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width =
          entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        setContainerWidth(width);
      }
    });

    resizeObserver.observe(scrollElement);
    setContainerWidth(scrollElement.clientWidth);

    return () => {
      resizeObserver.disconnect();
    };
  }, [scrollElement]);

  // Update layout synchronously via useMemo
  const layoutVersion = useMemo(() => {
    const items = new Map(
      Array.from(collection).map((node) => [node.key, node]),
    );
    const orderedKeys = Array.from(collection.getKeys());
    layout.setItems(items, orderedKeys);
    layout.update({ containerWidth });
    // Return a unique value to track layout state
    return `${collection.size}-${containerWidth}`;
  }, [collection, containerWidth, layout]);

  return {
    containerWidth,
    contentSize: layout.getContentSize(),
    layoutVersion,
  };
}
