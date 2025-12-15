'use client';

import { motion, type MotionProps } from 'motion/react';
import { type ElementType, forwardRef } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';
import ResponsiveContainer, {
  type ResponsiveContainerProps,
} from './ResponsiveContainer';

export const surfaceVariants = cva({
  base: 'publish-colors relative isolate grow overflow-hidden rounded-sm @xl:rounded @4xl:rounded-lg',
  variants: {
    level: {
      0: 'text-surface-contrast bg-surface',
      1: 'text-surface-1-contrast bg-surface-1',
      2: 'text-surface-2-contrast bg-surface-2',
      3: 'text-surface-3-contrast bg-surface-3',
      popover: 'text-surface-popover-contrast bg-surface-popover',
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
  noContainer?: boolean;
} & SurfaceVariants &
  ResponsiveContainerProps &
  Omit<
    React.ComponentPropsWithoutRef<T>,
    | keyof SurfaceVariants
    | keyof ResponsiveContainerProps
    | 'as'
    | 'noContainer'
  >;

/**
 * Surface is a layout component that provides a background and foreground color
 * and allows for spacing to be applied. It is intended to be used as a container
 * to construct hierarchical layouts, and is explicitly designed to support
 * being nested.
 *
 * Implementation note: Uses a ::before pseudo-element for the background layer
 * to ensure elevation shadows correctly reference the parent's background color
 * while keeping a single DOM element for clean layout control.
 *
 * To override the background color, use `before:bg-*` classes in className:
 * <Surface className="before:bg-primary text-primary-contrast">
 */
const SurfaceComponent = forwardRef<HTMLDivElement, SurfaceProps>(
  (
    {
      as,
      children,
      level,
      spacing,
      elevation,
      bleed,
      className,
      maxWidth,
      baseSize,
      noContainer = false,
      ...rest
    },
    ref,
  ) => {
    const Component = as ?? 'div';
    const surfaceElement = (
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

    if (noContainer) {
      return surfaceElement;
    }

    return (
      <ResponsiveContainer maxWidth={maxWidth} baseSize={baseSize}>
        {surfaceElement}
      </ResponsiveContainer>
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
