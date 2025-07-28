'use client';

import { cn } from '~/utils/shadcn';
import { useVirtualization } from './hooks/useVirtualization';
import { type VirtualListProps } from './types';
import { GridLayout } from './components/GridLayout';
import { ColumnLayout } from './components/ColumnLayout';
import { HorizontalLayout } from './components/HorizontalLayout';

const VirtualItem = <T,>({
  item,
  index,
  style,
  onClick,
  renderItem,
}: {
  item: T;
  index: number;
  style: React.CSSProperties;
  onClick?: (item: T, index: number) => void;
  renderItem: VirtualListProps<T>['renderItem'];
}) => {
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

export const VirtualList = <T,>({
  items,
  keyExtractor,
  renderItem,
  layout,
  itemHeight, // Phase 1 compatibility
  onItemClick,
  EmptyComponent,
  placeholder,
  overscan,
  animation,
  draggable,
  droppable,
  itemType,
  onDrop,
  accepts,
  getDragMetadata,
  getDragPreview,
  className,
  ariaLabel,
}: VirtualListProps<T>) => {
  // Always call hooks at the top level
  const legacyVirtualization = useVirtualization(
    {
      count: items.length,
      itemHeight: itemHeight ?? 50, // Default fallback
      overscan,
    },
  );

  // Phase 2: Use layout modes if provided, otherwise fall back to Phase 1 compatibility
  if (layout) {
    // Handle empty states for layout modes
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

    // Route to appropriate layout component
    switch (layout.mode) {
      case 'grid':
        return (
          <GridLayout
            items={items}
            config={layout}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onItemClick={onItemClick}
            overscan={overscan}
            animation={animation}
            draggable={draggable}
            droppable={droppable}
            itemType={itemType}
            accepts={accepts}
            getDragMetadata={getDragMetadata}
            getDragPreview={getDragPreview}
            onDrop={onDrop}
            listId="grid-list"
            className={cn('h-full w-full', className)}
          />
        );
      
      case 'columns':
        return (
          <ColumnLayout
            items={items}
            config={layout}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onItemClick={onItemClick}
            overscan={overscan}
            animation={animation}
            draggable={draggable}
            droppable={droppable}
            itemType={itemType}
            accepts={accepts}
            getDragMetadata={getDragMetadata}
            getDragPreview={getDragPreview}
            onDrop={onDrop}
            listId="column-list"
            className={cn('h-full w-full', className)}
          />
        );
      
      case 'horizontal':
        return (
          <HorizontalLayout
            items={items}
            config={layout}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onItemClick={onItemClick}
            overscan={overscan}
            animation={animation}
            draggable={draggable}
            droppable={droppable}
            itemType={itemType}
            accepts={accepts}
            getDragMetadata={getDragMetadata}
            getDragPreview={getDragPreview}
            onDrop={onDrop}
            listId="horizontal-list"
            className={cn('h-full w-full', className)}
          />
        );
    }
  }

  // Phase 1 compatibility: Fall back to original implementation
  if (!itemHeight) {
    throw new Error('Either layout or itemHeight must be provided');
  }

  const { parentRef, totalSize, virtualItems } = legacyVirtualization;

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

  return (
    <div
      ref={parentRef}
      className={cn('h-full w-full overflow-auto', className)}
      aria-label={ariaLabel}
      role="list"
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          if (!item) return null;

          const key = keyExtractor(item, virtualItem.index);

          return (
            <VirtualItem
              key={key}
              item={item}
              index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              onClick={onItemClick}
              renderItem={renderItem}
            />
          );
        })}
      </div>
    </div>
  );
};

VirtualList.displayName = 'VirtualList';
