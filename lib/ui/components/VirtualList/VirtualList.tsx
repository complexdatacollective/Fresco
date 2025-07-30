'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropTarget } from '~/lib/dnd';
import { cn } from '~/utils/shadcn';
import { DraggableVirtualItem } from './components/DraggableVirtualItem';

import { type AnimationConfig, type VirtualListProps } from './types';

import {
  calculateColumnWidth,
  calculateGridItemPosition,
  calculateGridItemsPerRow,
  calculateGridRowCount,
} from './utils/layout';

type VirtualItemProps<T> = {
  item: T;
  index: number;
  style: React.CSSProperties;
  onClick?: (item: T, index: number) => void;
  renderItem: VirtualListProps<T>['renderItem'];
  _isVisible: boolean;
  isFocused?: boolean;
  isSelected?: boolean;
  itemKey: string;
};

const VirtualItem = <T,>({
  item,
  index,
  style,
  onClick,
  renderItem,
  _isVisible,
  isFocused = false,
  isSelected = false,
  itemKey,
}: VirtualItemProps<T>) => {
  const handleClick = () => {
    if (onClick) {
      onClick(item, index);
    }
  };

  return (
    <div
      style={style}
      onClick={handleClick}
      className={cn(
        'flex',
        onClick && 'cursor-pointer',
        isFocused && 'ring-2 ring-blue-500',
        isSelected && 'bg-blue-100 dark:bg-blue-900/20',
      )}
      tabIndex={-1}
      role="listitem"
      data-index={index}
      data-key={itemKey}
      data-selected={isSelected}
    >
      {renderItem({ item, index, style: { width: '100%', height: '100%' } })}
    </div>
  );
};

// Default staggered nodelist animation
const defaultAnimationConfig: AnimationConfig = {
  enter: {
    keyframes: {
      from: {
        opacity: 0,
        transform: 'translateY(20px) scale(0.95)',
      },
      to: {
        opacity: 1,
        transform: 'translateY(0px) scale(1)',
      },
    },
    timing: {
      duration: 300,
      delay: 0,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    stagger: 50,
  },
  exit: {
    keyframes: {
      from: {
        opacity: 1,
        transform: 'translateY(0px) scale(1)',
      },
      to: {
        opacity: 0,
        transform: 'translateY(-10px) scale(0.95)',
      },
    },
    timing: {
      duration: 200,
      delay: 0,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    stagger: 25,
  },
};

type AnimatedVirtualItemProps<T> = VirtualItemProps<T> & {
  animationConfig?: AnimationConfig;
  isEntering?: boolean;
  isExiting?: boolean;
  staggerIndex?: number;
};

const AnimatedVirtualItem = <T,>({
  item,
  index,
  style,
  onClick,
  renderItem,
  _isVisible,
  animationConfig,
  isEntering = false,
  isExiting = false,
  staggerIndex = 0,
  isFocused = false,
  isSelected = false,
  itemKey,
}: AnimatedVirtualItemProps<T>) => {
  const [isVisible, setIsVisible] = useState(!isEntering);
  const [isAnimating, setIsAnimating] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const config = animationConfig?.disabled
    ? undefined
    : (animationConfig ?? defaultAnimationConfig);

  // Extract positioning transform from style prop (e.g., translateX for horizontal layout)
  const positionTransform = style.transform as string | undefined;

  useEffect(() => {
    if (!config || (!isEntering && !isExiting)) return;

    const animation = isEntering ? config.enter : config.exit;
    if (!animation) return;

    const staggerDelay = (animation.stagger ?? 0) * staggerIndex;
    const totalDelay = animation.timing.delay + staggerDelay;

    setIsAnimating(true);

    const timer = setTimeout(() => {
      if (isEntering) {
        setIsVisible(true);
      }

      const element = itemRef.current;
      if (!element) return;

      // Compose transforms: combine positioning transform with animation transforms
      const fromKeyframe = { ...animation.keyframes.from } as Keyframe;
      const toKeyframe = { ...animation.keyframes.to } as Keyframe;

      if (positionTransform) {
        // Combine positioning transform with animation transforms
        if (fromKeyframe.transform) {
          fromKeyframe.transform = `${positionTransform} ${fromKeyframe.transform}`;
        }
        if (toKeyframe.transform) {
          toKeyframe.transform = `${positionTransform} ${toKeyframe.transform}`;
        }
      }

      // Apply animation
      const keyframeAnimation = element.animate([fromKeyframe, toKeyframe], {
        duration: animation.timing.duration,
        easing: animation.timing.easing ?? 'ease',
        fill: 'forwards',
      });

      keyframeAnimation.addEventListener('finish', () => {
        setIsAnimating(false);
        if (isExiting) {
          setIsVisible(false);
        }
      });
    }, totalDelay);

    return () => clearTimeout(timer);
  }, [isEntering, isExiting, config, staggerIndex, positionTransform]);

  if (!isVisible && !isAnimating) {
    return null;
  }

  const animatedStyle = {
    ...style,
    ...(config && isEntering && !isVisible
      ? (config.enter?.keyframes.from ?? {})
      : {}),
    ...(config && isExiting ? (config.exit?.keyframes.from ?? {}) : {}),
  };

  // Don't override positioning transforms with animation transforms
  if (positionTransform) {
    animatedStyle.transform = positionTransform;
  }

  const handleClick = () => {
    if (onClick) {
      onClick(item, index);
    }
  };

  return (
    <div
      ref={itemRef}
      style={animatedStyle}
      onClick={handleClick}
      className={cn(
        'flex',
        onClick && 'cursor-pointer',
        isFocused && 'ring-2 ring-blue-500',
        isSelected && 'bg-blue-100 dark:bg-blue-900/20',
      )}
      tabIndex={-1}
      role="listitem"
      data-index={index}
      data-key={itemKey}
      data-selected={isSelected}
    >
      {renderItem({ item, index, style: { width: '100%', height: '100%' } })}
    </div>
  );
};

const DroppableWrapper = ({
  id,
  accepts,
  onDrop,
  children,
}: {
  id: string;
  accepts?: string[];
  onDrop?: (item: unknown) => void;
  children: React.ReactNode;
}) => {
  const { dropProps, isOver, willAccept } = useDropTarget({
    id,
    accepts: accepts ?? [],
    announcedName: 'Virtual list drop zone',
    onDrop: (metadata) => {
      if (onDrop) {
        onDrop(metadata);
      }
    },
  });

  return (
    <div
      {...dropProps}
      className={cn('h-full w-full', isOver && willAccept && 'bg-blue-50')}
    >
      {children}
    </div>
  );
};

export const VirtualList = <T,>({
  items,
  keyExtractor,
  renderItem,
  layout,

  onItemClick,
  EmptyComponent,
  placeholder,
  overscan = 5,
  draggable,
  droppable,
  itemType,
  onDrop,
  accepts,
  getDragMetadata,
  getDragPreview,
  className,
  ariaLabel,
  animations,
  ariaDescribedBy,
  role = 'list',
  multiSelect = false,
  onItemSelect,
  selectedItems,
}: VirtualListProps<T>) => {
  // Require layout prop
  if (!layout) {
    throw new Error('layout prop is required');
  }

  const parentRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Accessibility state
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [internalSelectedItems, setInternalSelectedItems] = useState<
    Set<string>
  >(new Set());

  // Use external selection if provided, otherwise use internal
  const currentSelectedItems = selectedItems ?? internalSelectedItems;

  // Resize observer to track container size changes - optimized to avoid recreation
  const stableResizeCallback = useCallback((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    }
  }, []);

  useEffect(() => {
    const element = parentRef.current;
    if (!element || !layout) return;

    const resizeObserver = new ResizeObserver(stableResizeCallback);
    resizeObserver.observe(element);
    
    setContainerSize({
      width: element.clientWidth,
      height: element.clientHeight,
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [stableResizeCallback, layout]); // Include layout but with stable callback

  // Unified item interaction handler for both click and keyboard
  const handleItemInteraction = useCallback(
    (item: T, itemIndex: number, triggerSelection = false) => {
      const key = keyExtractor(item, itemIndex);

      if (multiSelect && triggerSelection) {
        const newSelection = new Set(currentSelectedItems);
        if (newSelection.has(key)) {
          newSelection.delete(key);
        } else {
          newSelection.add(key);
        }

        if (!selectedItems) {
          setInternalSelectedItems(newSelection);
        }
        onItemSelect?.(
          Array.from(newSelection)
            .map((key) => {
              const index = items.findIndex((item, idx) => keyExtractor(item, idx) === key);
              return index >= 0 ? items[index] : null;
            })
            .filter((item): item is T => item !== null),
        );
      }

      onItemClick?.(item, itemIndex);
    },
    [
      keyExtractor,
      multiSelect,
      currentSelectedItems,
      selectedItems,
      onItemSelect,
      items,
      onItemClick,
    ],
  );

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (items.length === 0) return;

      const getColumnsCount = () => {
        switch (layout.mode) {
          case 'grid':
            return calculateGridItemsPerRow(
              containerSize.width,
              layout.itemSize.width,
              layout.gap,
            );
          case 'columns':
            return layout.columns;
          case 'horizontal':
            return 1;
          default:
            return 1;
        }
      };

      const columnsCount = getColumnsCount();
      let newFocusedIndex = focusedIndex;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (layout.mode === 'horizontal') {
            // No vertical navigation for horizontal layout
            return;
          }
          newFocusedIndex = Math.min(
            items.length - 1,
            focusedIndex + columnsCount,
          );
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (layout.mode === 'horizontal') {
            // No vertical navigation for horizontal layout
            return;
          }
          newFocusedIndex = Math.max(0, focusedIndex - columnsCount);
          break;

        case 'ArrowRight':
          event.preventDefault();
          if (layout.mode === 'horizontal') {
            newFocusedIndex = Math.min(items.length - 1, focusedIndex + 1);
          } else {
            newFocusedIndex = Math.min(items.length - 1, focusedIndex + 1);
          }
          break;

        case 'ArrowLeft':
          event.preventDefault();
          if (layout.mode === 'horizontal') {
            newFocusedIndex = Math.max(0, focusedIndex - 1);
          } else {
            newFocusedIndex = Math.max(0, focusedIndex - 1);
          }
          break;

        case 'Home':
          event.preventDefault();
          newFocusedIndex = 0;
          break;

        case 'End':
          event.preventDefault();
          newFocusedIndex = items.length - 1;
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            const item = items[focusedIndex];
            if (item) {
              handleItemInteraction(item, focusedIndex, true);
            }
          }
          break;

        default:
          return;
      }

      if (newFocusedIndex !== focusedIndex) {
        setFocusedIndex(newFocusedIndex);

        // Scroll to focused item
        if (layout.mode === 'horizontal') {
          const itemStart = newFocusedIndex * (layout.itemWidth + layout.gap);
          parentRef.current?.scrollTo({
            left: itemStart,
            behavior: 'smooth',
          });
        } else {
          const rowIndex = Math.floor(newFocusedIndex / columnsCount);
          const itemHeight =
            layout.mode === 'grid'
              ? layout.itemSize.height + layout.gap
              : layout.itemHeight + layout.gap;
          const itemTop = rowIndex * itemHeight;

          parentRef.current?.scrollTo({
            top: itemTop,
            behavior: 'smooth',
          });
        }
      }
    },
    [items, layout, containerSize, focusedIndex, handleItemInteraction],
  );

  // Focus management
  const handleFocus = useCallback(() => {
    if (focusedIndex === -1 && items.length > 0) {
      setFocusedIndex(0);
    }
  }, [focusedIndex, items.length]);

  const handleBlur = useCallback(() => {
    // Keep focus state for keyboard navigation
  }, []);

  // Calculate virtualization parameters based on layout mode
  const virtualizerConfig = useMemo(() => {
    if (!layout) return null;

    switch (layout.mode) {
      case 'grid': {
        const itemsPerRow = calculateGridItemsPerRow(
          containerSize.width,
          layout.itemSize.width,
          layout.gap,
        );
        const rowCount = calculateGridRowCount(items.length, itemsPerRow);
        return {
          horizontal: false,
          count: rowCount,
          estimateSize: () => layout.itemSize.height + layout.gap,
          itemsPerRow,
        };
      }
      case 'columns': {
        const columnWidth = calculateColumnWidth(
          containerSize.width,
          layout.columns,
          layout.gap,
        );
        const rowCount = Math.ceil(items.length / layout.columns);
        return {
          horizontal: false,
          count: rowCount,
          estimateSize: () => layout.itemHeight + layout.gap,
          columns: layout.columns,
          columnWidth,
        };
      }
      case 'horizontal': {
        return {
          horizontal: true,
          count: items.length,
          estimateSize: () => layout.itemWidth + layout.gap,
        };
      }
    }
  }, [layout, containerSize, items.length]);

  const virtualizer = useVirtualizer({
    horizontal: virtualizerConfig?.horizontal ?? false,
    count: virtualizerConfig?.count ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: virtualizerConfig?.estimateSize ?? (() => 50),
    overscan,
    enabled: !!(layout && virtualizerConfig),
  });

  // Handle empty state
  if (items.length === 0) {
    if (EmptyComponent) {
      return (
        <div
          className={cn(
            'flex min-h-[200px] items-center justify-center',
            className,
          )}
        >
          <EmptyComponent />
        </div>
      );
    }
    if (placeholder) {
      return (
        <div
          className={cn(
            'flex min-h-[200px] items-center justify-center',
            className,
          )}
        >
          {placeholder}
        </div>
      );
    }
    return (
      <div
        className={cn(
          'flex min-h-[200px] items-center justify-center',
          className,
        )}
        aria-label={ariaLabel}
        role="list"
      >
        <p className="text-muted-foreground">No items to display</p>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const ItemComponent = draggable
    ? DraggableVirtualItem
    : animations
      ? AnimatedVirtualItem
      : VirtualItem;

  const renderVirtualItems = () => {
    if (layout.mode === 'grid') {
      return virtualItems.map((virtualRow) => {
        const startIndex = virtualRow.index * virtualizerConfig!.itemsPerRow!;
        const endIndex = Math.min(
          startIndex + virtualizerConfig!.itemsPerRow!,
          items.length,
        );

        return (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${layout.itemSize.height}px`,
              transform: `translateY(${virtualRow.start}px)`,
              display: 'flex',
              gap: `${layout.gap}px`,
            }}
          >
            {Array.from({ length: endIndex - startIndex }, (_, i) => {
              const itemIndex = startIndex + i;
              const item = items[itemIndex];
              if (!item) return null;

              const key = keyExtractor(item, itemIndex);
              const { x } = calculateGridItemPosition(
                i,
                virtualizerConfig!.itemsPerRow!,
                layout.itemSize.width,
                layout.itemSize.height,
                layout.gap,
              );

              return (
                <ItemComponent
                  key={key}
                  item={item}
                  index={itemIndex}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    width: `${layout.itemSize.width}px`,
                    height: `${layout.itemSize.height}px`,
                  }}
                  onClick={() =>
                    handleItemInteraction(item, itemIndex, multiSelect)
                  }
                  renderItem={renderItem}
                  _isVisible={true}
                  isFocused={focusedIndex === itemIndex}
                  isSelected={currentSelectedItems.has(key)}
                  itemKey={key}
                  {...(animations && {
                    animationConfig: animations,
                    isEntering: true,
                    staggerIndex: itemIndex,
                  })}
                  {...(draggable && {
                    itemType,
                    getDragMetadata,
                    getDragPreview,
                  })}
                />
              );
            })}
          </div>
        );
      });
    }

    if (layout.mode === 'columns') {
      return virtualItems.map((virtualItem) => {
        const columnItems: { item: T; index: number; column: number }[] = [];

        for (let col = 0; col < virtualizerConfig!.columns!; col++) {
          const index = virtualItem.index * virtualizerConfig!.columns! + col;
          if (index < items.length && items[index]) {
            columnItems.push({
              item: items[index],
              index,
              column: col,
            });
          }
        }

        return (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
              display: 'grid',
              gridTemplateColumns: `repeat(${virtualizerConfig!.columns}, 1fr)`,
              gap: `${layout.gap}px`,
            }}
          >
            {columnItems.map(({ item, index, column }) => {
              const key = keyExtractor(item, index);

              return (
                <div key={key} style={{ gridColumn: column + 1 }}>
                  <ItemComponent
                    item={item}
                    index={index}
                    style={{
                      width: '100%',
                      height: `${layout.itemHeight}px`,
                    }}
                    renderItem={renderItem}
                    onClick={() =>
                      handleItemInteraction(item, index, multiSelect)
                    }
                    _isVisible={true}
                    isFocused={focusedIndex === index}
                    isSelected={currentSelectedItems.has(key)}
                    itemKey={key}
                    {...(animations && {
                      animationConfig: animations,
                      isEntering: true,
                      staggerIndex: index,
                    })}
                    {...(draggable && {
                      itemType,
                      getDragMetadata,
                      getDragPreview,
                    })}
                  />
                </div>
              );
            })}
          </div>
        );
      });
    }

    // Horizontal layout
    return virtualItems.map((virtualItem) => {
      const item = items[virtualItem.index];
      if (!item) return null;

      const key = keyExtractor(item, virtualItem.index);

      return (
        <ItemComponent
          key={key}
          item={item}
          index={virtualItem.index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${layout.itemWidth}px`,
            height: '100%',
            transform: `translateX(${virtualItem.start}px)`,
          }}
          onClick={() =>
            handleItemInteraction(item, virtualItem.index, multiSelect)
          }
          renderItem={renderItem}
          _isVisible={true}
          isFocused={focusedIndex === virtualItem.index}
          isSelected={currentSelectedItems.has(key)}
          itemKey={key}
          {...(animations && {
            animationConfig: animations,
            isEntering: true,
            staggerIndex: virtualItem.index,
          })}
          {...(draggable && {
            itemType,
            getDragMetadata,
            getDragPreview,
          })}
        />
      );
    });
  };

  const scrollDirection =
    layout.mode === 'horizontal' ? 'horizontal' : 'vertical';
  const totalSize = virtualizer.getTotalSize();
  const listId = `${layout.mode}-list`;

  const content = (
    <div
      style={{
        height: scrollDirection === 'vertical' ? totalSize : '100%',
        width: scrollDirection === 'horizontal' ? totalSize : '100%',
        position: 'relative',
      }}
    >
      {renderVirtualItems()}
    </div>
  );

  return (
    <div
      ref={parentRef}
      className={cn('h-full w-full', className)}
      style={{
        overflow: 'auto',
        overflowX: scrollDirection === 'horizontal' ? 'auto' : 'hidden',
        overflowY: scrollDirection === 'vertical' ? 'auto' : 'hidden',
      }}
      aria-label={ariaLabel || `${layout.mode} layout`}
      aria-describedby={ariaDescribedBy}
      role={role === 'grid' ? 'grid' : 'list'}
      aria-multiselectable={role === 'grid' && multiSelect ? true : undefined}
      tabIndex={items.length > 0 ? 0 : -1}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {droppable ? (
        <DroppableWrapper id={listId} accepts={accepts} onDrop={onDrop}>
          {content}
        </DroppableWrapper>
      ) : (
        content
      )}
    </div>
  );
};

VirtualList.displayName = 'VirtualList';
