'use client';

import { motion, type MotionProps } from 'motion/react';
import { type ElementType, forwardRef } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

export const surfaceVariants = cva({
  base: 'rounded-sm @xl:rounded @4xl:rounded-lg publish-colors @container grow',
  variants: {
    level: {
      0: 'bg-surface text-surface-contrast',
      1: 'bg-surface-1 text-surface-1-contrast',
      2: 'bg-surface-2 text-surface-2-contrast',
      3: 'bg-surface-3 text-surface-3-contrast',
      popover: 'bg-surface-popover text-surface-popover-contrast',
    },
    spacing: {
      none: '',
      xs: 'px-4 py-2 @xl:px-6 @xl:py-4',
      sm: 'px-6 py-4 @xl:px-8 @xl:py-6 @4xl:px-10 @4xl:py-6',
      md: 'px-8 py-6 @xl:px-10 @xl:py-8 @4xl:px-12 @4xl:py-8',
      lg: 'px-10 py-8 @xl:px-16 @xl:py-12 @4xl:px-20 @4xl:py-16',
      xl: 'px-12 py-10 @xl:px-20 @xl:py-16 @4xl:px-28 @4xl:py-20',
    },
    bleed: {
      none: '',
      xs: '-mx-2 @xl:-mx-4',
      sm: '-mx-4 @xl:-mx-6 @4xl:-mx-8',
      md: '-mx-8 @xl:-mx-10 @4xl:-mx-12',
      lg: '-mx-10 @xl:-mx-16 @4xl:-mx-20',
      xl: '-mx-10 @xl:-mx-20 @4xl:-mx-28',
    },
    elevation: {
      dynamic: 'elevation-low @xl:elevation-medium @4xl:elevation-high',
      low: 'elevation-low',
      medium: 'elevation-medium',
      high: 'elevation-high',
      none: 'shadow-none',
    },
  },
  defaultVariants: {
    level: 0,
    spacing: 'md',
    elevation: 'dynamic',
    bleed: 'none',
  },
});

export type SurfaceVariants = VariantProps<typeof surfaceVariants>;

type SurfaceProps<T extends ElementType = 'div'> = {
  as?: T;
} & SurfaceVariants &
  Omit<React.ComponentPropsWithoutRef<T>, keyof SurfaceVariants | 'as'>;

/**
 * Surface is a layout component that provides a background and foreground color
 * and allows for spacing to be applied. It is intended to be used as a container
 * to construct hierarchical layouts, and is explicitly designed to support
 * being nested.
 */
const SurfaceComponent = forwardRef<HTMLDivElement, SurfaceProps>(
  (
    { as, children, level, spacing, elevation, bleed, className, ...rest },
    ref,
  ) => {
    const Component = as ?? 'div'; // Default to 'div' if `as` is not provided
    return (
      <Component
        ref={ref}
        {...rest}
        className={cx(
          surfaceVariants({ level, spacing, elevation, bleed }),
          className,
        )}
      >
        {children}
      </Component>
    );
  },
);

SurfaceComponent.displayName = 'Surface';

const Surface = SurfaceComponent as <T extends ElementType = 'div'>(
  props: SurfaceProps<T> & { ref?: React.Ref<React.ElementRef<T>> },
) => React.ReactElement | null;

export default Surface;

export const MotionSurface = motion.create(Surface) as <E extends ElementType>(
  props: SurfaceProps<E> & MotionProps,
) => JSX.Element;
