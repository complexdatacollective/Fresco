'use client';

import { motion, type MotionProps } from 'motion/react';
import { type ElementType, forwardRef } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

export const surfaceVariants = cva({
  base: 'rounded-sm @xl:rounded @4xl:rounded-lg elevation-low @lg:elevation-medium @4xl:elevation-high bg-scope',
  variants: {
    level: {
      0: 'bg-surface text-surface-contrast border border-surface-contrast/10 [--color-text:var(--color-surface-contrast)] [--color-background:var(--color-surface)]',
      1: 'bg-surface-1 text-surface-1-contrast [--color-text:var(--color-surface-1-contrast)] [--color-background:var(--color-surface-1)]',
      2: 'bg-surface-2 text-surface-2-contrast [--color-text:var(--color-surface-2-contrast)] [--color-background:var(--color-surface-2)]',
      3: 'bg-surface-3 text-surface-3-contrast [--color-text:var(--color-surface-3-contrast)] [--color-background:var(--color-surface-3)]',
      4: 'bg-surface-4 text-surface-4-contrast [--color-text:var(--color-surface-4-contrast)] [--color-background:var(--color-surface-4)]',
    },
    spacing: {
      none: '',
      xs: 'px-2 py-1 sm:px-2 sm:py-1 md:px-4 md:py-2 lg:px-4 lg:py-2',
      sm: 'px-4 py-2 sm:px-4 sm:py-2 md:px-6 md:py-4 lg:px-8 lg:py-6',
      md: 'px-8 py-6 md:px-10 md:py-8 lg:px-12 lg:py-8',
      lg: 'px-10 py-8 sm:px-10 sm:py-8 md:px-16 md:py-12 lg:px-20 lg:py-16',
      xl: 'px-10 py-8 sm:px-10 sm:py-8 md:px-20 md:py-16 lg:px-28 lg:py-20',
    },
    elevation: {
      low: 'elevation-low',
      medium: 'elevation-medium',
      high: 'elevation-high',
      none: 'shadow-none',
    },
  },
  defaultVariants: {
    level: 0,
    spacing: 'md',
    elevation: 'none',
  },
});

export type SurfaceVariants = VariantProps<typeof surfaceVariants>;

type SurfaceProps<T extends ElementType = 'div'> = {
  as?: T;
  wrapperClassName?: string;
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
    { as, children, level, spacing, className, wrapperClassName, ...rest },
    ref,
  ) => {
    const Component = as ?? 'div'; // Default to 'div' if `as` is not provided
    return (
      <div className={cx('@container', wrapperClassName)}>
        <Component
          ref={ref}
          {...rest}
          className={cx(surfaceVariants({ level, spacing }), className)}
        >
          {children}
        </Component>
      </div>
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
