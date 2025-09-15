'use client';

import { motion, type MotionProps } from 'motion/react';
import { type ElementType, forwardRef } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

const surfaceVariants = cva({
  variants: {
    level: {
      // Level 0 is for dialogs and popovers
      0: 'bg-surface-0 text-surface-0-foreground [--background:var(--surface-0)] [--foreground:var(--surface-0-foreground)]',
      1: 'bg-surface-1 text-surface-1-foreground [--background:var(--surface-1)] [--foreground:var(--surface-1-foreground)]',
      2: 'bg-surface-2 text-surface-2-foreground [--background:var(--surface-2)] [--foreground:var(--surface-2-foreground)]',
      3: 'bg-surface-3 text-surface-3-foreground [--background:var(--surface-3)] [--foreground:var(--surface-3-foreground)]',
      4: 'bg-surface-4 text-surface-4-foreground [--background:var(--surface-4)] [--foreground:var(--surface-4-foreground)]',
    },
    spacing: {
      none: '',
      xs: 'px-2 py-1 sm:px-2 sm:py-1 md:px-4 md:py-2 lg:px-4 lg:py-2',
      sm: 'px-4 py-2 sm:px-4 sm:py-2 md:px-6 md:py-4 lg:px-8 lg:py-6',
      md: 'px-8 py-6 md:px-10 md:py-8 lg:px-12 lg:py-8',
      lg: 'px-8 py-6 sm:px-10 sm:py-8 md:px-12 md:py-10 lg:px-16 lg:py-10',
      xl: 'px-10 py-8 sm:px-12 sm:py-10 md:px-16 md:py-12 lg:px-20 lg:py-12',
    },
  },
  defaultVariants: {
    spacing: 'md',
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
 *
 * Note that Surface level '0' is a special case that is used for dialogs and popovers.
 */
const SurfaceComponent = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ as, children, level, spacing, className, ...rest }, ref) => {
    const Component = as ?? 'div'; // Default to 'div' if `as` is not provided
    return (
      <Component
        ref={ref}
        {...rest}
        className={cx(surfaceVariants({ level, spacing }), className)}
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
