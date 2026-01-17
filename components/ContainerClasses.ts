import { cx } from '~/utils/cva';

export const containerClasses = cx(
  'bg-surface text-surface-contrast relative mt-[-60px] flex min-w-[30rem] flex-col rounded p-8',
  'after:bg-surface-1/30 after:absolute after:inset-[-20px] after:z-[-1] after:rounded-lg after:shadow-2xl after:backdrop-blur-sm',
);
