import { cx } from '~/utils/cva';

export const containerClasses = cx(
  'relative mt-[-60px] flex flex-col rounded min-w-full-[30rem] bg-surface text-surface-contrast p-8',
  'after:absolute after:inset-[-20px] after:z-[-1] after:rounded-lg after:bg-surface-1/30 after:shadow-2xl after:backdrop-blur-sm',
);
