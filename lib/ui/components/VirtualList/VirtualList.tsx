'use client';

import { useVirtualizer } from '@tanstack/react-virtual';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '~/utils/shadcn';
import { DraggableVirtualItem } from './components/DraggableVirtualItem';
import { useDropTarget } from '~/lib/dnd';

import { type VirtualListProps, type AnimationConfig } from './types';

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
};

const VirtualItem = <T,>({
  item,
  index,
  style,
  onClick,
  renderItem,
  _isVisible,
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
      className={cn(onClick && 'cursor-pointer')}
    >
      {renderItem({ item, index, style })}
    </div>
  );
};

// Default staggered nodelist animation
const defaultAnimationConfig: AnimationConfig = {
  enter: {
    keyframes: {
      from: { 
        opacity: 0, 
        transform: 'translateY(20px) scale(0.95)' 
      },
      to: { 
        opacity: 1, 
        transform: 'translateY(0px) scale(1)' 
      }
    },
    timing: {
      duration: 300,
      delay: 0,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    },
    stagger: 50
  },
  exit: {
    keyframes: {
      from: { 
        opacity: 1, 
        transform: 'translateY(0px) scale(1)' 
      },
      to: { 
        opacity: 0, 
        transform: 'translateY(-10px) scale(0.95)' 
      }
    },
    timing: {
      duration: 200,
      delay: 0,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    },
    stagger: 25
  }
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
}: AnimatedVirtualItemProps<T>) => {
  const [isVisible, setIsVisible] = useState(!isEntering);
  const [isAnimating, setIsAnimating] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const config = animationConfig?.disabled ? undefined : (animationConfig ?? defaultAnimationConfig);

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

      // Apply animation
      const keyframeAnimation = element.animate(
        [
          animation.keyframes.from as Keyframe,
          animation.keyframes.to as Keyframe
        ],
        {
          duration: animation.timing.duration,
          easing: animation.timing.easing ?? 'ease',
          fill: 'forwards'
        }
      );

      keyframeAnimation.addEventListener('finish', () => {
        setIsAnimating(false);
        if (isExiting) {
          setIsVisible(false);
        }
      });

    }, totalDelay);

    return () => clearTimeout(timer);
  }, [isEntering, isExiting, config, staggerIndex]);

  if (!isVisible && !isAnimating) {
    return null;
  }

  const animatedStyle = {
    ...style,
    ...(config && isEntering && !isVisible ? (config.enter?.keyframes.from ?? {}) : {}),
    ...(config && isExiting ? (config.exit?.keyframes.from ?? {}) : {})
  };

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
      className={cn(onClick && 'cursor-pointer')}
    >
      {renderItem({ item, index, style })}
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
    <div {...dropProps} className={cn('h-full w-full', isOver && willAccept && 'bg-blue-50')}>
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
}: VirtualListProps<T>) => {
  // Require layout prop
  if (!layout) {
    throw new Error('layout prop is required');
  }

  const parentRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Resize observer to track container size changes
  useEffect(() => {
    if (!layout) return; // Only needed for layout modes
    
    const element = parentRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(element);
    setContainerSize({
      width: element.clientWidth,
      height: element.clientHeight,
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [layout]);



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
  const ItemComponent = draggable ? DraggableVirtualItem : (animations ? AnimatedVirtualItem : VirtualItem);

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
                    onClick={onItemClick}
                    renderItem={renderItem}
                    _isVisible={true}
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
                      onClick={() => onItemClick?.(item, index)}
                      _isVisible={true}
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
            onClick={() => onItemClick?.(item, virtualItem.index)}
            renderItem={renderItem}
            _isVisible={true}
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

    const scrollDirection = layout.mode === 'horizontal' ? 'horizontal' : 'vertical';
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
        <div
            style={{ width: '100%', height: '100%' }}
          >
            {renderVirtualItems()}
          </div>
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
        role="list"
      >
        {droppable ? (
          <DroppableWrapper
            id={listId}
            accepts={accepts}
            onDrop={onDrop}
          >
            {content}
          </DroppableWrapper>
        ) : (
          content
        )}
      </div>
    );
};

VirtualList.displayName = 'VirtualList';
