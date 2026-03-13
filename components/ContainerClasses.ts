import { cx } from '~/utils/cva';

export const containerClasses = cx(
  'relative m-6! overflow-visible',
  'before:bg-surface-1/30 mx-0 before:absolute before:inset-[-20px] before:z-[-1] before:rounded before:shadow-2xl before:backdrop-blur-sm',
);
