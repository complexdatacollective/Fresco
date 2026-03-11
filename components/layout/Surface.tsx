'use client';

import { motion, type MotionProps } from 'motion/react';
import { type ElementType, forwardRef, type JSX } from 'react';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import ResponsiveContainer, {
  type ResponsiveContainerProps,
} from './ResponsiveContainer';

export const surfaceSpacingVariants = cva({
  base: '',
  variants: {
    section: {
      header: 'pb-0!',
      content: 'py-0!',
      footer: 'pt-0!',
      container: '',
    },
    spacing: {
      none: '',
      xs: 'phone-landscape:px-3 tablet-portrait:px-4 tablet-landscape:px-6 phone-landscape:py-1.5 tablet-portrait:py-2 tablet-landscape:py-4 px-2 py-1',
      sm: 'phone-landscape:px-4 tablet-portrait:px-6 tablet-landscape:px-8 laptop:px-10 phone-landscape:py-3 tablet-portrait:py-4 tablet-landscape:py-6 laptop:py-6 px-3 py-2',
      md: 'phone-landscape:px-6 tablet-portrait:px-8 tablet-landscape:px-10 laptop:px-12 phone-landscape:py-4 tablet-portrait:py-6 tablet-landscape:py-8 laptop:py-8 px-4 py-3',
      lg: 'phone-landscape:px-8 tablet-portrait:px-10 tablet-landscape:px-16 laptop:px-20 phone-landscape:py-6 tablet-portrait:py-8 tablet-landscape:py-12 laptop:py-16 px-6 py-4',
      xl: 'phone-landscape:px-10 tablet-portrait:px-12 tablet-landscape:px-20 laptop:px-28 phone-landscape:py-8 tablet-portrait:py-10 tablet-landscape:py-16 laptop:py-20 px-8 py-6',
    },
  },
  defaultVariants: {
    spacing: 'md',
    section: 'container',
  },
});

export const surfaceVariants = compose(
  surfaceSpacingVariants,
  cva({
    base: 'publish-colors relative overflow-hidden rounded-sm @xl:rounded @4xl:rounded-lg',
    variants: {
      level: {
        0: 'text-surface-contrast bg-surface',
        1: 'text-surface-1-contrast bg-surface-1',
        2: 'text-surface-2-contrast bg-surface-2',
        3: 'text-surface-3-contrast bg-surface-3',
        popover: 'text-surface-popover-contrast bg-surface-popover',
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
        none: '',
      },
    },
    defaultVariants: {
      level: 0,
      elevation: 'low',
      bleed: 'none',
    },
  }),
);

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
          surfaceVariants({
            level,
            spacing,
            elevation,
            bleed,
          }),
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
  props: SurfaceProps<T> & { ref?: React.Ref<HTMLElement> },
) => React.ReactElement | null;

export default Surface;

export const MotionSurface = motion.create(Surface) as <E extends ElementType>(
  props: SurfaceProps<E> & MotionProps,
) => JSX.Element;
