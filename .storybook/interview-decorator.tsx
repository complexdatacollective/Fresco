import type { Decorator } from '@storybook/nextjs-vite';
import { motion } from 'motion/react';

/**
 * Wraps story in a motion.div with animation variant propagation,
 * matching how InterviewShell renders stages. This is required because
 * components like NodeList gate rendering behind `onAnimationComplete`,
 * which only fires when a parent propagates the `animate` variant.
 */
export const withInterviewAnimation: Decorator = (Story) => (
  <motion.div
    className="flex h-dvh w-full"
    initial="initial"
    animate="animate"
    exit="exit"
    variants={{
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }}
  >
    <Story />
  </motion.div>
);
