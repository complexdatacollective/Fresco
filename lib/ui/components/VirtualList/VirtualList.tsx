import { useVirtualizer } from '@tanstack/react-virtual';
import {
  AnimatePresence,
  motion,
  type TargetAndTransition,
} from 'motion/react';
import React, { useCallback, useRef, useState } from 'react';
import { cn } from '~/utils/shadcn';

export type LayoutMode = 'grid' | 'column' | 'horizontal';

export type ItemAnimationConfig = {
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  exit?: TargetAndTransition;
  transition?: Record<string, unknown>;
};

export type VirtualListProps<T extends { id: string | number }> = {
  items: T[];
  itemRenderer: (
    item: T,
    index: number,
    isSelected: boolean,
  ) => React.ReactNode;
  layout?: LayoutMode;
  columns?: number;
  itemSize?: number;
  itemWidth?: number;
  itemHeight?: number;
  gap?: number;
  selectedIds?: Set<string | number>;
  onItemClick?: (id: string | number) => void;
  className?: string;
  ariaLabel?: string;
  focusable?: boolean;
  animations?: ItemAnimationConfig | 'staggered' | 'none';
  staggerDelay?: number;
};

// Default staggered animation
const defaultStaggeredAnimation: ItemAnimationConfig = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
  transition: { duration: 0.2 },
};

export function VirtualList<T extends { id: string | number }>({
  items,
  itemRenderer,
  layout = 'grid',
  columns = 1,
  itemSize,
  itemWidth,
  itemHeight,
  gap = 8,
  selectedIds,
  onItemClick,
  className,
  ariaLabel,
  focusable = true,
  animations = 'staggered',
  staggerDelay = 0.02,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [animatedIds, setAnimatedIds] = useState<Set<string | number>>(
    new Set(),
  );

  const effectiveWidth = itemWidth ?? itemSize ?? 100;
  const effectiveHeight = itemHeight ?? itemSize ?? 100;

  const animationConfig = React.useMemo(() => {
    if (animations === 'none') return null;
    if (animations === 'staggered') return defaultStaggeredAnimation;
    return animations;
  }, [animations]);

  const getItemsPerRow = useCallback(() => {
    if (layout === 'column') return columns;
    if (layout === 'horizontal') return 1; // Each item is its own "row" for virtualizer. This is important for horizontal scrolling.
    if (layout === 'grid' && parentRef.current) {
      const containerWidth = parentRef.current.clientWidth;
      return Math.floor((containerWidth + gap) / (effectiveWidth + gap));
    }
    return 1;
  }, [layout, columns, effectiveWidth, gap]);

  const itemsPerRow = getItemsPerRow();

  const virtualizer = useVirtualizer({
    count: Math.ceil(items.length / itemsPerRow),
    getScrollElement: () => parentRef.current,
    estimateSize: () =>
      (layout === 'horizontal' ? effectiveWidth : effectiveHeight) + gap,
    horizontal: layout === 'horizontal',
    overscan: 5,
    getItemKey: (index) => `row-${index}`,
  });

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
      activeIndex,
      items,
      layout,
      getItemsPerRow,
      handleItemClick,
      virtualizer,
      onItemClick,
    ],
  );

  return (
    <div
      ref={parentRef}
      className={cn(
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
        className={cn(
          'relative',
          layout === 'horizontal' ? 'h-full' : 'w-full',
        )}
        style={{
          [layout === 'horizontal' ? 'width' : 'height']:
            `${virtualizer.getTotalSize()}px`,
        }}
      >
        <AnimatePresence mode="popLayout">
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const baseIndex = virtualRow.index * itemsPerRow;
            const rowItems = [];

            for (
              let i = 0;
              i < itemsPerRow && baseIndex + i < items.length;
              i++
            ) {
              const itemIndex = baseIndex + i;
              const item = items[itemIndex];
              if (!item) continue;

              const isSelected = selectedIds?.has(item.id) ?? false;
              const isActive = itemIndex === activeIndex;
              const hasAnimated = animatedIds.has(item.id);
              const delay =
                animations === 'staggered' && !hasAnimated
                  ? itemIndex * staggerDelay
                  : 0;

              const handleAnimationComplete = () => {
                if (!hasAnimated) {
                  setAnimatedIds((prev) => new Set(prev).add(item.id));
                }
              };

              const baseProps = {
                ...(focusable && {
                  'id': `item-${item.id}`,
                  'role': 'option',
                  'aria-selected': isSelected,
                }),
                onClick: () => handleItemClick(item.id),
                className: cn(
                  'transition-all',
                  onItemClick && 'cursor-pointer',
                  focusable &&
                    isActive &&
                    'ring-primary ring-offset-background rounded-lg ring-2 ring-offset-2 outline-none',
                ),
                style: {
                  width:
                    layout === 'column'
                      ? `calc((100% - ${gap * (columns - 1)}px) / ${columns})`
                      : `${effectiveWidth}px`,
                  height: `${effectiveHeight}px`,
                },
              };

              rowItems.push(
                animationConfig ? (
                  <motion.div
                    key={item.id}
                    {...baseProps}
                    initial={animationConfig.initial}
                    animate={animationConfig.animate}
                    exit={animationConfig.exit}
                    transition={{ ...animationConfig.transition, delay }}
                    layout
                    onAnimationComplete={handleAnimationComplete}
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
                className={cn(
                  'absolute top-0 left-0',
                  layout === 'horizontal'
                    ? 'flex h-full'
                    : 'flex w-full flex-wrap',
                )}
                style={{
                  transform:
                    layout === 'horizontal'
                      ? `translateX(${virtualRow.start}px)`
                      : `translateY(${virtualRow.start}px)`,
                  gap: `${gap}px`,
                }}
              >
                {rowItems}
              </div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
