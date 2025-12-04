import { useDirection } from '@radix-ui/react-direction';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useVirtualListAnimation } from './useVirtualListAnimation'; // adjust path as needed

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
  const containerRef = useRef<HTMLDivElement>(null);

  const [columns, setColumns] = useState(1); // Number of columns based on container width

  // ResizeObserver to determine column count based on container width
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

    const resizeObserver = new ResizeObserver(updateColumns);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const {
    displayItems,
    // isTransitioning,
    scope,
    // animate,
    shouldAnimateItem,
    getItemDelay,
    captureVisibleItems,
  } = useVirtualListAnimation({
    items,
    listId,
    containerRef,
    columns,
  });

  const rowCount = Math.ceil(displayItems.length / columns);
  const rowHeight = ITEM_HEIGHT + SPACING_UNIT_PX;

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    getItemKey: (index) => displayItems[index]!.id.toString(),
    estimateSize: () => rowHeight,
    paddingStart: SPACING_UNIT_PX,
    paddingEnd: SPACING_UNIT_PX,
    isRtl: direction === 'rtl',
  });

  // After virtual rows are available, capture visible items for stagger animation
  useEffect(() => {
    captureVisibleItems(rowVirtualizer.getVirtualItems());
  }, [rowVirtualizer.getVirtualItems, captureVisibleItems, rowVirtualizer]);

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
                const shouldAnimate = shouldAnimateItem(item.id);
                const delay = getItemDelay(item.id);

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
