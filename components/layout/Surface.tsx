'use client';

import { motion, type MotionProps } from 'motion/react';
import { type ElementType, forwardRef } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';

export const surfaceVariants = cva({
  base: 'rounded-sm @xl:rounded @4xl:rounded-lg outline-none bg-scope @container w-full',
  variants: {
    level: {
      0: 'bg-surface text-surface-contrast [--color-text:var(--color-surface-contrast)] [--background:var(--surface)]',
      1: 'bg-surface-1 text-surface-1-contrast [--color-text:var(--color-surface-1-contrast)] [--background:var(--surface-1)]',
      2: 'bg-surface-2 text-surface-2-contrast [--color-text:var(--color-surface-2-contrast)] [--background:var(--surface-2)]',
      3: 'bg-surface-3 text-surface-3-contrast [--color-text:var(--color-surface-3-contrast)] [--background:var(--surface-3)]',
      popover:
        'bg-surface-popover text-surface-popover-contrast [--color-text:var(--color-surface-popover-contrast)] [--background:var(--surface-popover)]',
    },
    spacing: {
      none: '',
      xs: 'px-2 py-2 tablet:px-4 tablet:py-3',
      sm: 'px-4 py-2 tablet:px-6 tablet:py-4 laptop:px-8 laptop:py-6',
      md: 'px-8 py-6 tablet:px-10 tablet:py-8 laptop:px-12 laptop:py-8',
      lg: 'px-10 py-8 tablet:px-16 tablet:py-12 laptop:px-20 laptop:py-16',
      xl: 'px-10 py-8 tablet:px-20 tablet:py-16 laptop:px-28 laptop:py-20',
    },
    elevation: {
      dynamic: 'elevation-low @xl:elevation-medium @4xl:elevation-high',
      low: 'elevation-low',
      medium: 'elevation-medium',
      high: 'elevation-high',
      none: 'shadow-none',
    },
    accent: {
      info: 'border-l-4 border-info/50',
      success: 'border-l-4 border-success/50',
      destructive: 'border-l-4 border-destructive/50',
      none: '',
    },
  },
  defaultVariants: {
    level: 0,
    spacing: 'md',
    elevation: 'dynamic',
    accent: 'none',
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
  ({ as, children, level, spacing, elevation, className, ...rest }, ref) => {
    const Component = as ?? 'div'; // Default to 'div' if `as` is not provided
    return (
      <Component
        ref={ref}
        {...rest}
        className={cx(
          surfaceVariants({ level, spacing, elevation }),
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
