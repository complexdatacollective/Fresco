'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '~/utils/shadcn';
import { Slot } from '@radix-ui/react-slot';
import { motion } from 'framer-motion';

const headingVariants = cva('text-balance', {
  variants: {
    variant: {
      'h1': 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
      'h2': 'scroll-m-20 text-3xl font-semibold tracking-tight',
      'h3': 'scroll-m-20 text-2xl font-semibold tracking-tight',
      'h4': 'scroll-m-20 text-xl font-semibold tracking-tight',
      'h4-all-caps':
        'scroll-m-20 text-sm font-extrabold tracking-widest uppercase',
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
};

export type HeadingProps = {
  asChild?: boolean;
  as?: string;
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants>;

const Heading = React.forwardRef<HTMLElement, HeadingProps>(
  ({ className, variant, as, asChild, ...props }, ref) => {
    const Comp = asChild
      ? Slot
      : as ?? (variant ? variantElementMap[variant] : undefined) ?? 'div';
    return (
      <Comp
        className={cn(headingVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Heading.displayName = 'Heading';

export const MotionHeading = motion(Heading);

export default Heading;
