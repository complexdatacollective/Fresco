'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ColumnModeConfig, AnimationConfig } from '../types';
import { 
  calculateGridRowCount,
  calculateColumnWidth
} from '../utils/layout';
import { AnimatedVirtualItem } from './AnimatedVirtualItem';
import { DraggableVirtualItem } from './DraggableVirtualItem';
import { mergeAnimationConfig, createListVariants } from '../utils/animation';

type ColumnLayoutProps<T> = {
  items: T[];
  config: ColumnModeConfig;
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

export const ColumnLayout = <T,>({
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
}: ColumnLayoutProps<T>) => {
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
  
  const { columnWidth, rowCount } = useMemo(() => {
    const columnWidth = calculateColumnWidth(containerWidth, config.columns, config.gap);
    const rowCount = calculateGridRowCount(items.length, config.columns);
    
    return { columnWidth, rowCount };
  }, [containerWidth, items.length, config.columns, config.gap]);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => config.itemHeight + config.gap,
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
          key="column-container"
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
          const startIndex = virtualRow.index * config.columns;
          const endIndex = Math.min(startIndex + config.columns, items.length);
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${config.itemHeight}px`,
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
                const ItemComponent = (draggable || droppable) ? DraggableVirtualItem : AnimatedVirtualItem;
                
                return (
                  <ItemComponent
                    key={key}
                    item={item}
                    index={itemIndex}
                    style={{
                      width: `${columnWidth}px`,
                      height: `${config.itemHeight}px`,
                      flexShrink: 0,
                    }}
                    onClick={onItemClick}
                    renderItem={renderItem}
                    animation={animationConfig}
                    isVisible={true}
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