import { cx } from '~/utils/cva';

export const containerClasses = cx(
  'relative mt-[-60px] flex flex-col rounded-xl min-w-full-[30rem] bg-surface-1 text-surface-1-contrast p-8',
  'after:absolute after:inset-[-20px] after:z-[-1] after:rounded-3xl after:bg-surface-1/30 after:shadow-2xl after:backdrop-blur-sm',
);
