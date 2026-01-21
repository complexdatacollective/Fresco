import { cx } from '~/utils/cva';

export const containerClasses = cx(
  'tablet:mx-0 relative mx-4 mt-[-60px] overflow-visible',
  'tablet:before:bg-surface-1/30 tablet:before:absolute tablet:before:inset-[-20px] tablet:before:z-[-1] tablet:before:rounded-lg tablet:before:shadow-2xl tablet:before:backdrop-blur-sm',
);
