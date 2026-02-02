'use client';

import { Slot } from '@radix-ui/react-slot';
import React from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

export const headingVariants = cva({
  base: 'font-heading scroll-m-20 text-balance',
  variants: {
    level: {
      h1: 'text-3xl font-semibold',
      h2: 'text-2xl font-semibold',
      h3: 'text-xl font-semibold',
      h4: 'text-lg font-bold',
      label: 'text-base font-bold',
    },
    variant: {
      'default': '',
      'all-caps': 'tracking-widest uppercase',
      'page-heading': 'text-4xl',
    },
    margin: {
      default: 'not-first:mt-4 not-last:mb-2',
      none: 'mb-0',
    },
  },
  defaultVariants: {
    level: 'h2',
    variant: 'default',
    margin: 'default',
  },
  compoundVariants: [
    { level: 'h4', variant: 'all-caps', className: 'text-base font-bold' },
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
