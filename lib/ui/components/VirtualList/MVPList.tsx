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
  ListItem?: React.ComponentType<{ item: Item }>;
};

const SPACING_UNIT_PX = 16; // Tailwind's gap-4 and px-4 equivalent
const ITEM_WIDTH = 100;
const ITEM_HEIGHT = 100;
const ANIMATION_TOTAL_DURATION = 1.0;

const DefaultListItem = ({ item }: { item: Item }) => (
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

export default function ResponsiveVirtualGrid({
  items,
  ListItem = DefaultListItem,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);
  const [initiallyVisibleItems, setInitiallyVisibleItems] = useState<
    Set<number>
  >(new Set());
  const [hasCapturedInitialItems, setHasCapturedInitialItems] = useState(false);
  const animatedItemsRef = useRef<Set<number>>(new Set());
  const visibleItemOrderRef = useRef<Map<number, number>>(new Map());
  const prevItemsRef = useRef(items);
  const [scope, animate] = useAnimate();
  const [displayItems, setDisplayItems] = useState(items);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle item changes with exit animation
  useEffect(() => {
    if (prevItemsRef.current !== items && prevItemsRef.current.length > 0) {
      // Start transitioning immediately to prevent flash of new items
      setIsTransitioning(true);

      // Animate out existing items simultaneously (no stagger)
      const exitAnimation = async () => {
        await animate(
          '.item',
          { scale: 0, opacity: 0 },
          { duration: 0.2 }, // Removed stagger for simultaneous animation
        );

        // Update to new items after exit completes
        setDisplayItems(items);

        // Reset animation tracking for new items
        animatedItemsRef.current = new Set();
        visibleItemOrderRef.current = new Map();
        setInitiallyVisibleItems(new Set());
        setHasCapturedInitialItems(false);
        setIsTransitioning(false);
      };

      exitAnimation();
    } else if (prevItemsRef.current !== items) {
      // First load or empty previous items
      setDisplayItems(items);
    }
    prevItemsRef.current = items;
  }, [items, animate]);

  // Layout effect ensures we calculate columns before rendering
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const updateColumns = () => {
      const containerWidth = containerRef.current?.offsetWidth ?? 0;

      const availableWidth = containerWidth - SPACING_UNIT_PX * 2;

      const maxColumns = Math.max(
        1,
        Math.floor(
          (availableWidth + SPACING_UNIT_PX) / (ITEM_WIDTH + SPACING_UNIT_PX),
        ),
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
    getItemKey: (index) => items[index]!.id.toString(),
    estimateSize: () => rowHeight,
    paddingStart: SPACING_UNIT_PX,
    paddingEnd: SPACING_UNIT_PX,
  });

  // Capture initially visible items on first render
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
                top: 0,
                left: 0,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {Array.from({ length: columns }).map((_, rowIndex) => {
                const itemIndex = startIndex + rowIndex;
                if (itemIndex >= displayItems.length) return null;

                const item = displayItems[itemIndex]!;
                const isInitiallyVisible = initiallyVisibleItems.has(item.id);
                const hasAnimated = animatedItemsRef.current.has(item.id);
                const shouldAnimate = isInitiallyVisible && !hasAnimated;

                // Mark item as animated
                if (shouldAnimate) {
                  animatedItemsRef.current.add(item.id);
                }

                const visibleOrder =
                  visibleItemOrderRef.current.get(item.id) ?? 0;

                const delay = shouldAnimate ? visibleOrder * delayPerItem : 0;

                return shouldAnimate ? (
                  <motion.div
                    layout="position"
                    layoutId={item.id.toString()}
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
