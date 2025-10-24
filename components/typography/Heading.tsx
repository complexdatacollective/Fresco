'use client';

import { Slot } from '@radix-ui/react-slot';
import React from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

export const headingVariants = cva({
  base: 'text-balance font-heading',
  variants: {
    level: {
      h1: 'scroll-m-20 text-3xl',
      h2: 'scroll-m-20 text-2xl',
      h3: 'scroll-m-20 text-xl font-semibold',
      h4: 'scroll-m-20 text-lg font-semibold',
    },
    variant: {
      'default': '',
      'all-caps': 'uppercase tracking-widest',
      'page-heading': 'text-4xl',
    },
    margin: {
      default: 'not-last:mb-1.5 not-first:mt-4',
      none: 'mb-0',
    },
  },
  defaultVariants: {
    level: 'h2',
    variant: 'default',
    margin: 'default',
  },
  compoundVariants: [
    { level: 'h4', variant: 'all-caps', className: 'font-bold text-base' },
  ],
});

type HeadingProps = {
  asChild?: boolean;
  as?: string;
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants>;

const Heading = React.forwardRef<HTMLElement, HeadingProps>(
  ({ className, variant, level, margin, as, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : (as ?? level ?? 'div');
    return (
      <Comp
        className={cx(headingVariants({ variant, level, margin, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Heading.displayName = 'Heading';

export default Heading;
