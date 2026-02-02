'use client';

import * as React from 'react';
import { useRender, type RenderProp } from '~/lib/legacy-ui/utils/useRender';
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

const levelToElement = {
  h1: <h1 />,
  h2: <h2 />,
  h3: <h3 />,
  h4: <h4 />,
  label: <h4 />,
} as const;

type HeadingRenderProps = React.HTMLAttributes<HTMLHeadingElement> &
  React.RefAttributes<HTMLHeadingElement> &
  Record<string, unknown>;

type HeadingProps = {
  render?: RenderProp<HeadingRenderProps>;
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants>;

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, variant, level = 'h2', margin, render, ...props }, ref) => {
    const defaultElement = levelToElement[level];

    const headingProps: HeadingRenderProps = {
      className: cx(headingVariants({ variant, level, margin, className })),
      ref,
      ...props,
    };

    return useRender(render, defaultElement, headingProps);
  },
);

Heading.displayName = 'Heading';

export default Heading;
