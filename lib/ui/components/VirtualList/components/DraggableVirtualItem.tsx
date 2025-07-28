'use client';

import { motion } from 'motion/react';
import { cn } from '~/utils/shadcn';
import type { AnimationConfig, VirtualListProps } from '../types';
import { createItemVariants, calculateStaggerDelay } from '../utils/animation';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

type DraggableVirtualItemProps<T> = {
  item: T;
  index: number;
  style: React.CSSProperties;
  onClick?: (item: T, index: number) => void;
  renderItem: VirtualListProps<T>['renderItem'];
  animation: AnimationConfig;
  isVisible: boolean;
  
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

export const DraggableVirtualItem = <T,>({
  item,
  index,
  style,
  onClick,
  renderItem,
  animation,
  isVisible,
  draggable = false,
  droppable = false,
  itemType,
  accepts,
  getDragMetadata,
  getDragPreview,
  onDrop,
  listId,
}: DraggableVirtualItemProps<T>) => {
  const { dragProps, dropProps, isDragging, isOver, canDrop } = useDragAndDrop({
    item,
    index,
    draggable,
    droppable,
    itemType,
    accepts,
    getDragMetadata,
    getDragPreview,
    onDrop,
    listId,
  });

  const handleClick = () => {
    if (onClick) {
      onClick(item, index);
    }
  };

  // If animations are disabled, render without motion
  if (!animation.enabled) {
    return (
      <div
        {...dragProps}
        {...dropProps}
        style={style}
        onClick={handleClick}
        className={cn(
          onClick && 'cursor-pointer',
          isDragging && 'opacity-50',
          isOver && canDrop && 'ring-2 ring-blue-500',
        )}
      >
        {renderItem({ item, index, style })}
      </div>
    );
  }

  const itemVariants = createItemVariants(animation);
  const staggerDelay = calculateStaggerDelay(index, animation);

  return (
    <motion.div
      {...dragProps}
      {...dropProps}
      style={style}
      onClick={handleClick}
      className={cn(
        onClick && 'cursor-pointer',
        isDragging && 'opacity-50',
        isOver && canDrop && 'ring-2 ring-blue-500',
      )}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      variants={itemVariants as any}
      initial="initial"
      animate={isVisible ? "animate" : "initial"}
      exit="exit"
      transition={{
        ...(itemVariants.animate.transition ?? {}),
        delay: staggerDelay,
      }}
      layout // Enable layout animations for smooth repositioning
      // Drag state affects scale and opacity
      whileDrag={{
        scale: 0.95,
        opacity: 0.7,
      }}
    >
      {renderItem({ item, index, style })}
    </motion.div>
  );
};