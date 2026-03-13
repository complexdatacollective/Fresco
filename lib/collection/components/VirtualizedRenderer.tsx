'use client';

import { AnimatePresence, LayoutGroup } from 'motion/react';
import {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useSelectionManager } from '../contexts';
import { useMeasureItems } from '../hooks/useMeasureItems';
import { useStaggerAnimation } from '../hooks/useStaggerAnimation';
import { useVirtualization } from '../hooks/useVirtualization';
import { type Layout } from '../layout/Layout';
import {
  type Collection,
  type CollectionProps,
  type ItemRenderer,
} from '../types';
import { CollectionItem } from './CollectionItem';

type VirtualizedRendererProps<T> = {
  layout: Layout<T>;
  collection: Collection<T>;
  renderItem: ItemRenderer<T>;
  dragAndDropHooks?: CollectionProps<T>['dragAndDropHooks'];
  animate?: boolean;
  animationKey?: string | number;
  collectionId: string;
  scrollRef: RefObject<HTMLElement | null>;
  /** Number of rows to render beyond the visible viewport. Default: 5 */
  overscan?: number;
  layoutGroupId?: string | null;
};

/**
 * Virtualized renderer that only renders items visible in the viewport.
 * Uses custom measurement and virtualization hooks for efficient scroll windowing.
 *
 * Supports all layout modes (List, Grid, InlineGrid) by:
 * 1. Measuring items in a hidden container
 * 2. Calculating row positions based on measured heights
 * 3. Only rendering rows within the visible viewport (plus overscan)
 *
 * Animation support:
 * - Items animate when entering/exiting the viewport
 * - Layout animations work for items within visible rows
 * - Initial stagger animation applies to first visible items
 */
export function VirtualizedRenderer<T>({
  layout,
  collection,
  renderItem,
  dragAndDropHooks,
  animate: shouldAnimate,
  animationKey,
  collectionId,
  scrollRef,
  overscan = 5,
  layoutGroupId,
}: VirtualizedRendererProps<T>) {
  // Track container width for layout calculations
  const [containerWidth, setContainerWidth] = useState(0);

  // Track the scroll element in state to trigger effects when ref becomes available
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  // Sync ref to state when it changes (runs every render to detect ref population)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (scrollRef.current !== scrollElement) {
      setScrollElement(scrollRef.current);
    }
  });

  // Get selection manager for scroll-to-focused integration
  const selectionManager = useSelectionManager();

  // Track container width with ResizeObserver (batched to RAF for performance)
  useLayoutEffect(() => {
    if (!scrollElement) return;

    let rafId: number | null = null;
    let pendingWidth: number | null = null;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        pendingWidth = entry.contentRect.width;
      }

      // Batch resize callbacks to animation frame
      rafId ??= requestAnimationFrame(() => {
        if (pendingWidth !== null) {
          setContainerWidth(pendingWidth);
          pendingWidth = null;
        }
        rafId = null;
      });
    });

    // Initial width - use content width (excluding padding) to match ResizeObserver's contentRect
    const computedStyle = getComputedStyle(scrollElement);
    const paddingX =
      parseFloat(computedStyle.paddingLeft) +
      parseFloat(computedStyle.paddingRight);
    const initialWidth = scrollElement.clientWidth - paddingX;
    setContainerWidth(initialWidth);

    observer.observe(scrollElement);
    return () => {
      observer.disconnect();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [scrollElement]);

  // Measure items in hidden container
  const { measurements, isComplete, measurementContainer } = useMeasureItems({
    collection,
    layout,
    renderItem,
    containerWidth,
    skip: containerWidth === 0,
  });

  // Get rows from layout after measurements complete
  // Must update layout with containerWidth BEFORE calling updateWithMeasurements
  // because updateWithMeasurements uses this.containerWidth internally
  const rows = useMemo(() => {
    // Wait for measurements to complete and container to have width
    if (!isComplete || containerWidth === 0) return [];
    // Update layout with current container width first
    layout.update({ containerWidth });
    // Then apply measurements (which uses containerWidth internally)
    if (measurements.size > 0) {
      layout.updateWithMeasurements(measurements);
    }
    return layout.getRows();
  }, [layout, isComplete, measurements, containerWidth]);

  // Virtualize rows
  const { virtualItems, totalHeight, scrollToKey } = useVirtualization({
    rows,
    scrollRef,
    overscan,
  });

  // Scroll to focused key when it changes (for typeahead support)
  useEffect(() => {
    if (selectionManager.focusedKey !== null) {
      scrollToKey(selectionManager.focusedKey);
    }
  }, [selectionManager.focusedKey, scrollToKey]);

  // Get layout styles for row items
  const containerStyle = layout.getContainerStyles();
  const itemStyle = layout.getItemStyles();

  const rowStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    // Use container styles for row layout (flex/grid)
    ...containerStyle,
    // Override height-related styles since we position absolutely
    minHeight: undefined,
    height: 'auto',
  };

  // Calculate visible item count for stagger animation
  const visibleItemCount = virtualItems.reduce(
    (sum, { row }) => sum + row.itemKeys.length,
    0,
  );

  const scope = useStaggerAnimation(
    shouldAnimate ?? false,
    visibleItemCount,
    animationKey,
  );

  const effectiveLayoutGroupId =
    layoutGroupId === undefined ? collectionId : (layoutGroupId ?? undefined);

  return (
    <>
      {measurementContainer}
      <LayoutGroup id={effectiveLayoutGroupId}>
        <div
          className="relative w-full"
          style={{ height: totalHeight }}
          ref={scope}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {virtualItems.map(({ row, offsetTop }) => (
              <div
                key={row.rowIndex}
                style={{
                  ...rowStyle,
                  transform: `translateY(${offsetTop}px)`,
                }}
              >
                {row.itemKeys.map((key) => {
                  const node = collection.getItem(key);
                  if (!node) return null;

                  return (
                    <div key={key} style={itemStyle}>
                      <div data-stagger-item data-stagger-key={animationKey}>
                        <CollectionItem
                          node={node}
                          renderItem={renderItem}
                          dragAndDropHooks={dragAndDropHooks}
                          layout={layout}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </>
  );
}
