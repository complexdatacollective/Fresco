import type { AnimationConfig } from '../types';

// Default animation configuration based on current NodeList implementation
export const defaultAnimationConfig: AnimationConfig = {
  enabled: true,
  stagger: 0.05, // 50ms between items
  duration: 0.4, // 400ms duration
  easing: 'easeOut',
  initial: { opacity: 0, y: '-20%', scale: 0 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: '-20%', scale: 0 },
};

// Create Framer Motion variants for list container
export const createListVariants = (config: AnimationConfig) => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      delayChildren: 0.25,
      staggerChildren: config.stagger,
    },
  },
  exit: { opacity: 0 },
});

// Create Framer Motion variants for individual items
export const createItemVariants = (config: AnimationConfig) => ({
  initial: config.initial ?? { opacity: 0 },
  animate: {
    ...config.animate,
    transition: {
      duration: config.duration,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    ...config.exit,
    transition: {
      duration: config.duration * 0.5, // Faster exit
      ease: 'easeOut' as const,
    },
  },
});

// Calculate staggered delay for an item based on its index
export const calculateStaggerDelay = (
  index: number,
  config: AnimationConfig,
): number => {
  return index * config.stagger;
};

// Merge user animation config with defaults
export const mergeAnimationConfig = (
  userConfig?: Partial<AnimationConfig>,
): AnimationConfig => {
  if (!userConfig?.enabled) {
    return { ...defaultAnimationConfig, enabled: false };
  }

  return {
    ...defaultAnimationConfig,
    ...userConfig,
    initial: { ...defaultAnimationConfig.initial, ...userConfig.initial },
    animate: { ...defaultAnimationConfig.animate, ...userConfig.animate },
    exit: { ...defaultAnimationConfig.exit, ...userConfig.exit },
  };
};