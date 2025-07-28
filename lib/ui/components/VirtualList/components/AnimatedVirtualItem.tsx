'use client';

import { motion } from 'motion/react';
import type { AnimationConfig, VirtualListProps } from '../types';
import { createItemVariants, calculateStaggerDelay } from '../utils/animation';

type AnimatedVirtualItemProps<T> = {
  item: T;
  index: number;
  style: React.CSSProperties;
  onClick?: (item: T, index: number) => void;
  renderItem: VirtualListProps<T>['renderItem'];
  animation: AnimationConfig;
  isVisible: boolean; // Controls when animation should trigger
};

export const AnimatedVirtualItem = <T,>({
  item,
  index,
  style,
  onClick,
  renderItem,
  animation,
  isVisible,
}: AnimatedVirtualItemProps<T>) => {
  const handleClick = () => {
    if (onClick) {
      onClick(item, index);
    }
  };

  // If animations are disabled, render without motion
  if (!animation.enabled) {
    return (
      <div
        style={style}
        onClick={handleClick}
        className={onClick ? 'cursor-pointer' : ''}
      >
        {renderItem({ item, index, style })}
      </div>
    );
  }

  const itemVariants = createItemVariants(animation);
  const staggerDelay = calculateStaggerDelay(index, animation);

  return (
    <motion.div
      style={style}
      onClick={handleClick}
      className={onClick ? 'cursor-pointer' : ''}
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
    >
      {renderItem({ item, index, style })}
    </motion.div>
  );
};