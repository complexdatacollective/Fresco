import * as React from 'react';
import { cva, type VariantProps } from '~/utils/cva';

import { cx } from '~/utils/cva';

const badgeVariants = cva({
  base: 'inline-flex shrink items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  variants: {
    variant: {
      default:
        'bg-primary text-primary-contrast hover:bg-primary/80 border-transparent',
      secondary:
        'bg-secondary text-secondary-contrast hover:bg-secondary/80 border-transparent',
      destructive:
        'bg-destructive text-destructive-contrast hover:bg-destructive/80 border-transparent',
      outline: 'text-current',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type BadgeProps = object &
  React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cx(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
