import { cx } from '~/utils/cva';

export const containerClasses = cx(
  'relative mx-2 mt-0 overflow-visible',
  'phone-landscape:mx-0 phone-landscape:before:bg-surface-1/30 phone-landscape:before:absolute phone-landscape:before:inset-[-20px] phone-landscape:before:z-[-1] phone-landscape:before:rounded-lg phone-landscape:before:shadow-2xl phone-landscape:before:backdrop-blur-sm',
);
