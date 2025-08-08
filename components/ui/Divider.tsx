import { cx } from '~/utils/cva';

export const Divider = ({ className }: { className?: string }) => (
  <hr
    className={cx(
      'mx-auto my-4 w-[30rem] max-w-full rounded-full border-[1.5px] border-[hsl(var(--platinum--dark))]',
      className,
    )}
  />
);
