'use client';

import { useCallback, type RefCallback } from 'react';
import { type VirtualItem } from '../virtualization/types';

export type PositionedItemProps = {
  virtualItem: VirtualItem;
  children: React.ReactNode;
  /** Optional ref callback for measuring the element (used for dynamic heights) */
  measureRef?: (element: HTMLElement | null) => void;
};

/**
 * Wrapper component that absolutely positions items based on layout info.
 * Used by VirtualizedRenderer to position visible items within the scrollable area.
 *
 * When measureRef is provided, the element will be measured for dynamic height
 * calculation by the virtualizer.
 */
export function PositionedItem({
  virtualItem,
  children,
  measureRef,
}: PositionedItemProps) {
  // Combine the measure ref with the data-index attribute for tanstack virtualizer
  const combinedRef: RefCallback<HTMLDivElement> = useCallback(
    (node) => {
      if (measureRef) {
        measureRef(node);
      }
    },
    [measureRef],
  );

  // When measureRef is provided, use minHeight to allow content to expand
  // so the virtualizer can measure the actual height
  const useDynamicHeight = !!measureRef;

  return (
    <div
      ref={combinedRef}
      data-index={virtualItem.index}
      data-key={virtualItem.key}
      style={{
        position: 'absolute',
        top: virtualItem.layoutInfo.rect.y,
        left: virtualItem.layoutInfo.rect.x,
        // Use 100% width for list layouts to avoid timing issues with containerWidth
        width: virtualItem.layoutInfo.rect.width || '100%',
        // Use minHeight when measuring to allow content to expand
        // Use fixed height for grids or when measuring is disabled
        ...(useDynamicHeight
          ? { minHeight: virtualItem.layoutInfo.rect.height }
          : { height: virtualItem.layoutInfo.rect.height }),
      }}
    >
      {children}
    </div>
  );
}
