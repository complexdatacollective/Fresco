import { cx } from '~/utils/cva';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const classes = cx('animate-pulse rounded bg-current/20', className);
  return <div className={classes} {...props} />;
}

export { Skeleton };
