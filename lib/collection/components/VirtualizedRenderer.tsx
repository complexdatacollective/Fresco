'use client';

import {
  AnimatePresence,
  LayoutGroup,
  stagger,
  useAnimate,
} from 'motion/react';
import {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelectionManager } from '../contexts';
import { useMeasureItems } from '../hooks/useMeasureItems';
import { useVirtualization } from '../hooks/useVirtualization';
import { type Layout } from '../layout/Layout';
import {
  type Collection,
  type CollectionProps,
  type ItemRenderer,
} from '../types';
import { CollectionItem } from './CollectionItem';

const ANIMATION_CONFIG = {
  staggerDelay: 0.05,
} as const;

export type VirtualizedRendererProps<T> = {
  layout: Layout<T>;
  collection: Collection<T>;
  renderItem: ItemRenderer<T>;
  dragAndDropHooks?: CollectionProps<T>['dragAndDropHooks'];
  animate?: boolean;
  collectionId: string;
  scrollRef: RefObject<HTMLElement | null>;
  /** Number of rows to render beyond the visible viewport. Default: 5 */
  overscan?: number;
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
  collectionId,
  scrollRef,
  overscan = 5,
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

    // Initial width
    setContainerWidth(scrollElement.clientWidth);

    observer.observe(scrollElement);
    return () => {
      observer.disconnect();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [scrollElement]);

  // Create a stable key for collection identity to avoid unnecessary layout updates
  // when collection reference changes but items remain the same
  const collectionSize = collection.size;

  // Update layout when container width changes
  useLayoutEffect(() => {
    if (containerWidth > 0) {
      layout.update({ containerWidth });
    }
  }, [layout, containerWidth, collectionSize]);

  // Measure items in hidden container
  const { measurements, isComplete, measurementContainer } = useMeasureItems({
    collection,
    layout,
    renderItem,
    containerWidth,
    skip: containerWidth === 0,
  });

  // Get rows from layout (will update after measurements)
  const rows = useMemo(() => {
    // Only return rows after measurements are complete
    if (!isComplete) return [];
    // Update layout with measurements before getting rows
    if (measurements.size > 0) {
      layout.updateWithMeasurements(measurements);
    }
    return layout.getRows();
  }, [layout, isComplete, measurements]);

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

  // Setup animation using imperative useAnimate API
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const hasAnimatedRef = useRef(false);

  // Run stagger animation on mount - only after items are actually rendered
  useEffect(() => {
    if (
      !shouldAnimate ||
      hasAnimatedRef.current ||
      collection.size === 0 ||
      virtualItems.length === 0
    ) {
      return;
    }

    hasAnimatedRef.current = true;

    const runAnimation = async () => {
      await animate(
        '[data-collection-item]',
        { opacity: [0, 1], y: ['20%', '0%'], scale: [0.6, 1] },
        {
          type: 'spring',
          stiffness: 500,
          damping: 20,
          delay: stagger(ANIMATION_CONFIG.staggerDelay),
        },
      );
    };

    void runAnimation();
  }, [animate, shouldAnimate, collection.size, virtualItems.length]);

  return (
    <>
      {measurementContainer}
      <LayoutGroup id={collectionId}>
        <div
          style={{
            height: totalHeight,
            width: '100%',
            position: 'relative',
          }}
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
                      <CollectionItem
                        node={node}
                        renderItem={renderItem}
                        dragAndDropHooks={dragAndDropHooks}
                        layout={layout}
                      />
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
