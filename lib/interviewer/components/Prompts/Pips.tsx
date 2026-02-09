'use client';

import { motion } from 'motion/react';
import { cx } from '~/utils/cva';

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delay: 0.15,
      when: 'beforeChildren' as const,
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: '-200%' },
  animate: { opacity: 1, y: 0 },
};

type PipsProps = {
  large?: boolean;
  count?: number;
  currentIndex?: number;
};

/**
 * Renders a set of pips indicating the current prompt position.
 * Hidden from assistive technology since navigation is handled externally.
 */
const Pips = ({ large = false, count = 0, currentIndex = 0 }: PipsProps) => {
  const pipsClasses = cx(
    'flex w-full shrink-0 grow-0 items-center justify-center gap-2',
    large ? 'basis-12' : 'basis-9',
  );

  const getPipClasses = (isActive: boolean) =>
    cx(
      'rounded-full border-2 border-current bg-transparent transition-colors duration-200',
      large ? 'size-8' : 'size-5',
      isActive && 'bg-current/30',
    );

  return (
    <motion.div
      className={pipsClasses}
      variants={containerVariants}
      aria-hidden={true}
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === currentIndex;
        return (
          <motion.div
            key={index}
            className={getPipClasses(isActive)}
            variants={itemVariants}
            data-active={isActive}
          />
        );
      })}
    </motion.div>
  );
};

export default Pips;
