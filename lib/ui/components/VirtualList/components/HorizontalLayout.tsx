'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { HorizontalModeConfig, AnimationConfig } from '../types';
import { AnimatedVirtualItem } from './AnimatedVirtualItem';
import { DraggableVirtualItem } from './DraggableVirtualItem';
import { mergeAnimationConfig, createListVariants } from '../utils/animation';

type HorizontalLayoutProps<T> = {
  items: T[];
  config: HorizontalModeConfig;
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

export const HorizontalLayout = <T,>({
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
}: HorizontalLayoutProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const animationConfig = mergeAnimationConfig(animation);
  const listVariants = createListVariants(animationConfig);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => config.itemWidth + config.gap,
    overscan,
    horizontal: true,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        height: '100%',
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key="horizontal-container"
          style={{
            width: `${virtualizer.getTotalSize()}px`,
            height: `${config.itemHeight}px`,
            position: 'relative',
          }}
          variants={listVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          if (!item) return null;
          
          const key = keyExtractor(item, virtualItem.index);
          
          const ItemComponent = (draggable || droppable) ? DraggableVirtualItem : AnimatedVirtualItem;
          
          return (
            <ItemComponent
              key={key}
              item={item}
              index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${config.itemWidth}px`,
                height: `${config.itemHeight}px`,
                transform: `translateX(${virtualItem.start}px)`,
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
};