import { cn } from '~/utils/shadcn';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const classes = cn('animate-pulse rounded-md bg-platinum', className);
  return <div className={classes} {...props} />;
}

export { Skeleton };
