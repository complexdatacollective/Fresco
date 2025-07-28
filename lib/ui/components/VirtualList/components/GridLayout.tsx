'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GridModeConfig, AnimationConfig } from '../types';
import { 
  calculateGridItemsPerRow, 
  calculateGridRowCount,
  calculateGridItemPosition 
} from '../utils/layout';
import { AnimatedVirtualItem } from './AnimatedVirtualItem';
import { DraggableVirtualItem } from './DraggableVirtualItem';
import { mergeAnimationConfig, createListVariants } from '../utils/animation';

type GridLayoutProps<T> = {
  items: T[];
  config: GridModeConfig;
  keyExtractor: (item: T, index: number) => string;
  renderItem: (props: {
    item: T;
    index: number;
    style: React.CSSProperties;
  }) => React.ReactElement;
  onItemClick?: (item: T, index: number) => void;
  overscan?: number;
  className?: string;
  animation?: AnimationConfig;
  
  // Drag & Drop props
  draggable?: boolean;
  droppable?: boolean;
  itemType?: string;
  accepts?: string[];
  getDragMetadata?: (item: T) => Record<string, unknown>;
  getDragPreview?: (item: T) => React.ReactElement;
  onDrop?: (metadata: unknown) => void;
  listId?: string;
};

export const GridLayout = <T,>({
  items,
  config,
  keyExtractor,
  renderItem,
  onItemClick,
  overscan = 5,
  className,
  animation,
  draggable,
  droppable,
  itemType,
  accepts,
  getDragMetadata,
  getDragPreview,
  onDrop,
  listId,
}: GridLayoutProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const animationConfig = mergeAnimationConfig(animation);
  const listVariants = createListVariants(animationConfig);
  
  // Resize observer to track container width changes
  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(element);
    // Set initial width
    setContainerWidth(element.clientWidth);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  const { itemsPerRow, rowCount } = useMemo(() => {
    const itemsPerRow = calculateGridItemsPerRow(
      containerWidth,
      config.itemSize.width,
      config.gap,
    );
    const rowCount = calculateGridRowCount(items.length, itemsPerRow);
    
    return { itemsPerRow, rowCount };
  }, [containerWidth, items.length, config.itemSize.width, config.gap]);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => config.itemSize.height + config.gap,
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        height: '100%',
        width: '100%',
        overflow: 'auto',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key="grid-container"
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
          variants={listVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * itemsPerRow;
          const endIndex = Math.min(startIndex + itemsPerRow, items.length);
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${config.itemSize.height}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex',
                gap: `${config.gap}px`,
              }}
            >
              {Array.from({ length: endIndex - startIndex }, (_, i) => {
                const itemIndex = startIndex + i;
                const item = items[itemIndex];
                if (!item) return null;
                
                const key = keyExtractor(item, itemIndex);
                const { x } = calculateGridItemPosition(
                  i, // Position within row
                  itemsPerRow,
                  config.itemSize.width,
                  config.itemSize.height,
                  config.gap,
                );
                
                // Use DraggableVirtualItem if drag/drop is enabled, otherwise AnimatedVirtualItem
                const ItemComponent = (draggable || droppable) ? DraggableVirtualItem : AnimatedVirtualItem;
                
                return (
                  <ItemComponent
                    key={key}
                    item={item}
                    index={itemIndex}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      width: `${config.itemSize.width}px`,
                      height: `${config.itemSize.height}px`,
                    }}
                    onClick={onItemClick}
                    renderItem={renderItem}
                    animation={animationConfig}
                    isVisible={true}
                    // Drag & Drop props (only passed to DraggableVirtualItem)
                    {...((draggable ?? droppable) && {
                      draggable,
                      droppable,
                      itemType,
                      accepts,
                      getDragMetadata,
                      getDragPreview,
                      onDrop,
                      listId,
                    })}
                  />
                );
              })}
            </div>
          );
        })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};