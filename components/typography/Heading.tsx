'use client';

import { Slot } from '@radix-ui/react-slot';
import React from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

export const headingVariants = cva({
  base: 'text-balance',
  variants: {
    variant: {
      'h1': 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
      'h2': 'scroll-m-20 text-3xl font-semibold tracking-tight',
      'h3': 'scroll-m-20 text-2xl font-semibold tracking-tight',
      'h4': 'scroll-m-20 text-xl font-semibold tracking-tight',
      'h4-all-caps':
        'scroll-m-20 text-sm font-extrabold tracking-widest uppercase',
      'label':
        'scroll-m-20 text-md font-bold tracking-normal peer-disabled:opacity-70 peer-disabled:cursor-not-allowed',
    },
    margin: {
      default: 'not-first:mt-4',
      none: 'mt-0',
    },
  },
});

type VariantPropType = VariantProps<typeof headingVariants>;

const variantElementMap: Record<
  NonNullable<VariantPropType['variant']>,
  string
> = {
  'h1': 'h1',
  'h2': 'h2',
  'h3': 'h3',
  'h4': 'h4',
  'h4-all-caps': 'h4',
  'label': 'label',
};

type HeadingProps = {
  asChild?: boolean;
  as?: string;
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants>;

const Heading = React.forwardRef<HTMLElement, HeadingProps>(
  ({ className, variant, as, asChild, ...props }, ref) => {
    const Comp = asChild
      ? Slot
      : (as ?? (variant ? variantElementMap[variant] : undefined) ?? 'div');
    return (
      <Comp
        className={cx(headingVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Heading.displayName = 'Heading';

export default Heading;
