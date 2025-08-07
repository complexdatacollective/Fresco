import { useDirection } from '@radix-ui/react-direction';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, useAnimate } from 'motion/react';
import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Item = {
  id: number;
  name: string;
};

type Props = {
  items: Item[];
  listId: string; // Controlled listId to decide when to animate
  ListItem?: React.ComponentType<{ item: Item }>;
};

const SPACING_UNIT_PX = 16; // Tailwind's gap-4 and px-4 equivalent
const ITEM_WIDTH = 100;
const ITEM_HEIGHT = 100;
const ANIMATION_TOTAL_DURATION = 1.0;

const DefaultListItem = ({ item }: { item: Item }) => {
  return (
    <div
      className="box-border flex items-center justify-center rounded-full border border-gray-300 bg-gray-200 text-center"
      style={{
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        userSelect: 'none',
      }}
    >
      {item.name}
    </div>
  );
};

export default function ResponsiveVirtualGrid({
  items,
  listId,
  ListItem = DefaultListItem,
}: Props) {
  const direction = useDirection();

  const [columns, setColumns] = useState(1); // Number of columns based on container width
  const [initiallyVisibleItems, setInitiallyVisibleItems] = useState<
    Set<number>
  >(new Set()); // Track initially visible items for animation
  const [hasCapturedInitialItems, setHasCapturedInitialItems] = useState(false); // Have we captured the initial visible items?
  const [displayItems, setDisplayItems] = useState(items); // Local copy of items, so we can handle transitioning when items change.
  const [isTransitioning, setIsTransitioning] = useState(false); // Are we currently animating?

  const containerRef = useRef<HTMLDivElement>(null);
  const animatedItemsRef = useRef<Set<number>>(new Set()); // Track items that have been animated
  const visibleItemOrderRef = useRef<Map<number, number>>(new Map()); // Track order of visible items for animation delays
  const prevListIdRef = useRef<string | null>(null);
  const [scope, animate] = useAnimate();

  // Animation effect controlled by listId changes
  useEffect(() => {
    if (prevListIdRef.current !== null && prevListIdRef.current !== listId) {
      // listId changed, so start transition to animate exit/enter sequence
      setIsTransitioning(true);

      // Animate out existing items simultaneously (no stagger)
      const exitAnimation = async () => {
        await animate('.item', { scale: 0, opacity: 0 }, { duration: 0.2 });

        // TODO: This works, but breaks the initial animation. No way around it I can find.
        // Disabling makes the animation work, but leaves the user scrolled to wherever they were.
        // containerRef.current?.scrollTo({ top: 0 });

        // Update to new items after exit completes
        setDisplayItems(items);

        // Reset animation tracking for new items
        animatedItemsRef.current = new Set();
        visibleItemOrderRef.current = new Map();
        setInitiallyVisibleItems(new Set());
        setHasCapturedInitialItems(false);
        setIsTransitioning(false);
      };

      void exitAnimation();
    } else {
      // No listId change — just update displayItems immediately without animation
      setDisplayItems(items);
    }

    prevListIdRef.current = listId;
  }, [listId, items, animate]);

  // Calculate columns based on container width
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const updateColumns = () => {
      const containerWidth = containerRef.current?.offsetWidth ?? 0;
      const availableWidth = containerWidth - SPACING_UNIT_PX * 2;
      const maxColumns = Math.max(
        1,
        Math.floor(availableWidth / (ITEM_WIDTH + SPACING_UNIT_PX)),
      );
      setColumns(maxColumns);
    };

    updateColumns();

    const resizeObserver = new ResizeObserver(updateColumns); // For performance
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const rowCount = Math.ceil(displayItems.length / columns);
  const rowHeight = ITEM_HEIGHT + SPACING_UNIT_PX;

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    getItemKey: (index) => displayItems[index]!.id.toString(),
    estimateSize: () => rowHeight,
    paddingStart: SPACING_UNIT_PX,
    paddingEnd: SPACING_UNIT_PX,
    isRtl: direction === 'rtl', // Use direction from Radix!
  });

  // Capture initially visible items for stagger animation
  useEffect(() => {
    if (hasCapturedInitialItems || columns === 1 || isTransitioning) return;

    const virtualItems = rowVirtualizer.getVirtualItems();
    const visibleItemIds = new Set<number>();
    const itemOrder = new Map<number, number>();
    let visibleIndex = 0;

    virtualItems.forEach((virtualRow) => {
      const startIndex = virtualRow.index * columns;
      for (let i = 0; i < columns; i++) {
        const itemIndex = startIndex + i;
        if (itemIndex < displayItems.length) {
          const itemId = displayItems[itemIndex]!.id;
          visibleItemIds.add(itemId);
          itemOrder.set(itemId, visibleIndex);
          visibleIndex++;
        }
      }
    });

    if (visibleItemIds.size > 0) {
      setInitiallyVisibleItems(visibleItemIds);
      visibleItemOrderRef.current = itemOrder;
      setHasCapturedInitialItems(true);
    }
  }, [
    columns,
    displayItems,
    rowVirtualizer,
    hasCapturedInitialItems,
    isTransitioning,
  ]);

  /**
   * Regardless of the number of items that are being animated,
   * we want the animation to finish in ANIMATION_TOTAL_DURATION
   * seconds. This helps make the stagger effect more consistent.
   */
  const totalVisibleCount = initiallyVisibleItems.size;
  const delayPerItem =
    totalVisibleCount > 1
      ? ANIMATION_TOTAL_DURATION / (totalVisibleCount - 1)
      : 0;

  return (
    <div
      ref={containerRef}
      className="h-[500px] overflow-auto border border-gray-300 px-4"
    >
      <div
        ref={scope}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;

          return (
            <div
              key={virtualRow.key}
              className="flex gap-4"
              style={{
                position: 'absolute',
                top: virtualRow.start,
                left: 0,
              }}
            >
              {Array.from({ length: columns }).map((_, rowIndex) => {
                const itemIndex = startIndex + rowIndex;
                if (itemIndex >= displayItems.length) return null;

                const item = displayItems[itemIndex]!;
                const isInitiallyVisible = initiallyVisibleItems.has(item.id);
                const hasAnimated = animatedItemsRef.current.has(item.id);
                const shouldAnimate = isInitiallyVisible && !hasAnimated;

                if (shouldAnimate) {
                  animatedItemsRef.current.add(item.id);
                }

                const visibleOrder =
                  visibleItemOrderRef.current.get(item.id) ?? 0;
                const delay = shouldAnimate ? visibleOrder * delayPerItem : 0;

                return shouldAnimate ? (
                  <motion.div
                    className="item"
                    key={item.id}
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: '0%' }}
                    transition={{
                      delay,
                      type: 'spring',
                      duration: 0.5,
                    }}
                  >
                    <ListItem item={item} />
                  </motion.div>
                ) : (
                  <div key={item.id} className="item">
                    <ListItem item={item} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
