import { cx } from '~/utils/cva';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const classes = cx('animate-pulse rounded-md bg-platinum', className);
  return <div className={classes} {...props} />;
}

export { Skeleton };
