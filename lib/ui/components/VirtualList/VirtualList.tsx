import { useDirection } from '@radix-ui/react-direction';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '~/utils/shadcn';
import { useVirtualListAnimation, type CustomAnimation } from './useVirtualListAnimation';

type Item = {
  id: number;
  name: string;
};

export type VirtualListProps = {
  items: Item[];
  itemRenderer: (
    item: Item,
    index: number,
    isSelected: boolean,
  ) => React.ReactNode;
  layout?: 'grid' | 'column' | 'horizontal';
  columns?: number;
  itemWidth?: number; // Note: ignored in column layout - items span 100% of column
  itemHeight?: number;
  spacingUnit?: number; // spacing unit px (e.g., 16 for gap-4 px-4)
  selectedIds?: Set<string | number>;
  onItemClick?: (id: string | number) => void;
  className?: string;
  ariaLabel?: string;
  focusable?: boolean;
  listId: string; // Controlled listId to decide when to animate
  customAnimation?: CustomAnimation; // Optional custom animation configuration
};

export function VirtualList({
  items,
  itemRenderer,
  layout = 'grid',
  columns: columnsOverride,
  itemWidth = 100,
  itemHeight = 100,
  spacingUnit = 16,
  selectedIds,
  onItemClick,
  className,
  ariaLabel,
  focusable = true,
  listId,
  customAnimation,
}: VirtualListProps) {
  const direction = useDirection();
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1); // Number of columns based on container width

  const {
    displayItems,
    // isTransitioning,
    scope,
    // animate,
    shouldAnimateItem,
    getItemDelay,
    captureVisibleItems,
    getItemVariants,
  } = useVirtualListAnimation({
    items,
    listId,
    containerRef,
    columns,
    customAnimation,
  });

  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // ResizeObserver to determine column count based on container width
  useLayoutEffect(() => {
    // If layout is 'column', use the columns prop or default to 3
    // itemWidth is ignored in column layout - items span 100% of column
    if (layout === 'column') {
      setColumns(columnsOverride ?? 3);
      return;
    }

    // If layout is 'horizontal', set to number of items (single row)
    if (layout === 'horizontal') {
      setColumns(displayItems.length);
      return;
    }

    // For 'grid' layout, calculate responsive columns based on itemWidth
    if (!containerRef.current) return;

    const updateColumns = () => {
      const containerWidth = containerRef.current?.offsetWidth ?? 0;
      const availableWidth = containerWidth - spacingUnit * 2;
      const maxColumns = Math.max(
        1,
        Math.floor(availableWidth / (itemWidth + spacingUnit)),
      );
      setColumns(maxColumns);
    };

    updateColumns();

    const resizeObserver = new ResizeObserver(updateColumns);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [layout, columnsOverride, displayItems.length, spacingUnit, itemWidth]);

  const rowCount =
    layout === 'horizontal'
      ? displayItems.length
      : Math.ceil(displayItems.length / columns);
  const rowHeight =
    layout === 'horizontal'
      ? itemWidth + spacingUnit
      : itemHeight + spacingUnit;

  const getItemsPerRow = useCallback(() => {
    if (layout === 'column') return columns; // itemWidth ignored - items span column width
    if (layout === 'horizontal') return 1; // Each item is its own "row" for virtualizer. This is important for horizontal scrolling.
    if (layout === 'grid' && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      return Math.floor(
        (containerWidth + spacingUnit) / (itemWidth + spacingUnit),
      );
    }
    return 1;
  }, [layout, columns, itemWidth, spacingUnit]);

  const itemsPerRow = getItemsPerRow();

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    getItemKey: (index) =>
      layout === 'horizontal'
        ? displayItems[index]!.id.toString()
        : `row-${index}`,
    estimateSize: () => rowHeight,
    paddingStart: spacingUnit,
    paddingEnd: spacingUnit,
    isRtl: direction === 'rtl',
    horizontal: layout === 'horizontal',
  });

  // After virtual rows are available, capture visible items for stagger animation
  useEffect(() => {
    captureVisibleItems(virtualizer.getVirtualItems());
  }, [virtualizer.getVirtualItems, captureVisibleItems, virtualizer]);

  const handleItemClick = useCallback(
    (itemId: string | number) => {
      onItemClick?.(itemId);
    },
    [onItemClick],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const itemsPerRow = getItemsPerRow();
      let newIndex = activeIndex;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (layout === 'horizontal') return;
          newIndex = Math.min(activeIndex + itemsPerRow, items.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (layout === 'horizontal') return;
          newIndex = Math.max(activeIndex - itemsPerRow, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newIndex = Math.min(activeIndex + 1, items.length - 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = Math.max(activeIndex - 1, 0);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (
            onItemClick &&
            activeIndex >= 0 &&
            activeIndex < items.length &&
            items[activeIndex]
          ) {
            handleItemClick(items[activeIndex].id);
          }
          break;
        default:
          return;
      }

      if (newIndex !== activeIndex && newIndex >= 0) {
        setActiveIndex(newIndex);
        const rowIndex = Math.floor(newIndex / itemsPerRow);
        virtualizer.scrollToIndex(rowIndex, { align: 'auto' });
      }
    },
    [
      getItemsPerRow,
      activeIndex,
      layout,
      items,
      onItemClick,
      handleItemClick,
      virtualizer,
    ],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        layout === 'horizontal'
          ? 'overflow-x-auto overflow-y-hidden'
          : 'overflow-auto',
        'relative h-full w-full overflow-auto',
        focusable && 'focus:ring-ring',
        className,
      )}
      {...(focusable && {
        'tabIndex': 0,
        'role': 'listbox',
        'aria-multiselectable': 'true',
        'aria-label': ariaLabel ?? `List of ${items.length} items`,
        'aria-activedescendant':
          activeIndex >= 0 && items[activeIndex]
            ? `item-${items[activeIndex].id}`
            : undefined,
        'onKeyDown': handleKeyDown,
      })}
    >
      <div
        ref={scope}
        style={{
          height:
            layout === 'horizontal'
              ? `${itemHeight}px`
              : `${virtualizer.getTotalSize()}px`,
          width:
            layout === 'horizontal'
              ? `${displayItems.length * (itemWidth + spacingUnit)}px`
              : 'auto',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          if (layout === 'horizontal') {
            const item = displayItems[virtualRow.index];
            if (!item) return null;

            const isSelected = selectedIds?.has(item.id) ?? false;
            const isActive = virtualRow.index === activeIndex;
            const shouldAnimate = shouldAnimateItem(item.id);
            const delay = getItemDelay(item.id);

            const baseProps = {
              ...(focusable && {
                'id': `item-${item.id}`,
                'role': 'option',
                'aria-selected': isSelected,
              }),
              onClick: () => handleItemClick(item.id),
              className: cn(
                'item transition-all',
                onItemClick && 'cursor-pointer',
                focusable &&
                  isActive &&
                  'ring-primary ring-offset-background rounded-lg ring-2 ring-offset-2 outline-none',
              ),
              style: {
                width: `${itemWidth}px`,
                height: `${itemHeight}px`,
              },
            };

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: virtualRow.start,
                }}
              >
                {shouldAnimate ? (
                  <motion.div
                    {...baseProps}
                    variants={getItemVariants()}
                    initial="initial"
                    animate="animate"
                    transition={{
                      delay,
                      type: 'spring',
                      duration: 0.5,
                    }}
                  >
                    {itemRenderer(item, virtualRow.index, isSelected)}
                  </motion.div>
                ) : (
                  <div {...baseProps}>
                    {itemRenderer(item, virtualRow.index, isSelected)}
                  </div>
                )}
              </div>
            );
          }

          // Grid / column layout
          const startIndex = virtualRow.index * itemsPerRow;
          const rowItems = [];

          for (
            let i = 0;
            i < itemsPerRow && startIndex + i < displayItems.length;
            i++
          ) {
            const itemIndex = startIndex + i;
            const item = displayItems[itemIndex];
            if (!item) continue;

            const isSelected = selectedIds?.has(item.id) ?? false;
            const isActive = itemIndex === activeIndex;
            const shouldAnimate = shouldAnimateItem(item.id);
            const delay = getItemDelay(item.id);

            const baseProps = {
              ...(focusable && {
                'id': `item-${item.id}`,
                'role': 'option',
                'aria-selected': isSelected,
              }),
              onClick: () => handleItemClick(item.id),
              className: cn(
                'item',
                onItemClick && 'cursor-pointer',
                focusable &&
                  isActive &&
                  'ring-primary ring-offset-background rounded-lg ring-2 ring-offset-2 outline-none',
              ),
              style: {
                width:
                  layout === 'column'
                    ? `calc((100% - ${spacingUnit * (columns - 1)}px) / ${columns})`
                    : `${itemWidth}px`,
                height: `${itemHeight}px`,
              },
            };

            rowItems.push(
              shouldAnimate ? (
                <motion.div
                  key={item.id}
                  {...baseProps}
                  variants={getItemVariants()}
                  initial="initial"
                  animate="animate"
                  transition={{
                    delay,
                    type: 'spring',
                    duration: 0.5,
                  }}
                >
                  {itemRenderer(item, itemIndex, isSelected)}
                </motion.div>
              ) : (
                <div key={item.id} {...baseProps}>
                  {itemRenderer(item, itemIndex, isSelected)}
                </div>
              ),
            );
          }

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 flex w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                gap: `${spacingUnit}px`,
              }}
            >
              {rowItems}
            </div>
          );
        })}
      </div>
    </div>
  );
}
