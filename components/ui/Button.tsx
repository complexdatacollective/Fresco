'use client';

import { Slot } from '@radix-ui/react-slot';
import { motion } from 'motion/react';
import * as React from 'react';
import {
  controlVariants,
  proportionalLucideIconVariants,
  sizeVariants,
  spacingVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { Skeleton } from './skeleton';

const buttonSpecificVariants = cva({
  base: cx(
    'font-semibold inline-flex tracking-wide cursor-pointer shrink-0',
    'justify-center',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'focusable',
  ),
  variants: {
    variant: {
      default:
        'bg-(--component-text) text-(--component-bg) hover:enabled:bg-[color-mix(in_oklab,var(--component-text),_var(--component-bg)_15%)]',
      outline:
        'border-2 border-[var(--component-text)] text-[var(--component-text)] hover:enabled:bg-[var(--component-text)] hover:enabled:text-[var(--component-bg)]',
      text: 'text-[var(--component-text)] hover:enabled:bg-[var(--component-text)] hover:enabled:text-[var(--component-bg)]',
      dashed:
        'border-2 border-[var(--component-text)] border-dashed text-[var(--component-text)] hover:enabled:bg-[var(--component-text)] hover:enabled:text-[var(--component-bg)]',
    },
    color: {
      default:
        '[--component-text:var(--color-neutral)] [--component-bg:var(--color-neutral-contrast)]',
      dynamic:
        'text-current [--component-bg:currentColor] [--component-text:color-mix(in_oklab,var(--published-bg,--background),_currentColor_5%)]',
      primary:
        'focus:outline-primary [--component-text:var(--color-primary)] [--component-bg:var(--color-primary-contrast)]',
      secondary:
        'focus:outline-secondary [--component-text:var(--color-secondary)] [--component-bg:var(--color-secondary-contrast)]',
      warning:
        'focus:outline-warning [--component-text:var(--color-warning)] [--component-bg:var(--color-warning-contrast)]',
      info: '[--component-text:var(--color-info)] [--component-bg:var(--color-info-contrast)]',
      destructive:
        'focus:outline-destructive [--component-text:var(--color-destructive)] [--component-bg:var(--color-destructive-contrast)]',
      success:
        'focus:outline-success [--component-text:var(--color-success)] [--component-bg:var(--color-success-contrast)]',
      accent:
        'focus:outline-accent [--component-text:var(--color-accent)] [--component-bg:var(--color-accent-contrast)]',
    },
    hasIcon: { true: 'gap-2' },
    iconPosition: {
      left: 'flex-row',
      right: 'flex-row-reverse',
    },
  },
  defaultVariants: {
    variant: 'default',
    color: 'dynamic',
    hasIcon: false,
    iconPosition: 'left',
  },
  compoundVariants: [
    // Default color bg is too light to use as outline or text color
    {
      variant: ['outline', 'text', 'dashed'],
      color: 'default',
      className:
        '[--component-text:var(--color-neutral-contrast)] hover:enabled:[--component-text:var(--color-neutral)]',
    },
    {
      variant: ['outline', 'dashed'],
      color: 'dynamic',
      className: 'border-current',
    },
    {
      variant: 'default',
      color: 'dynamic',
      className:
        'hover:enabled:[--component-text:color-mix(in_oklab,var(--published-bg),_var(--component-bg)_15%)]',
    },
    {
      variant: ['text'],
      className: 'elevation-none',
    },
  ],
});

const buttonVariants = compose(
  sizeVariants,
  proportionalLucideIconVariants,
  controlVariants,
  spacingVariants,
  buttonSpecificVariants,
);

type BaseButtonProps = {
  variant?: VariantProps<typeof buttonVariants>['variant'];
  asChild?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<VariantProps<typeof buttonVariants>, 'color'> &
  BaseButtonProps & {
    color?:
      | 'default'
      | 'dynamic'
      | 'primary'
      | 'secondary'
      | 'warning'
      | 'info'
      | 'destructive'
      | 'success';
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      color,
      size,
      asChild = false,
      children,
      icon,
      iconPosition = 'left',
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={buttonVariants({
          variant,
          color,
          size,
          hasIcon: !!icon,
          iconPosition: iconPosition,
          className,
        })}
        ref={ref}
        {...props}
      >
        {icon}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

type IconButtonProps = Omit<
  ButtonProps,
  'icon' | 'children' | 'hasIcon' | 'iconPosition' | 'color'
> & {
  'icon': React.ReactNode;
  'aria-label': string;
  'color'?:
    | 'default'
    | 'dynamic'
    | 'primary'
    | 'secondary'
    | 'warning'
    | 'info'
    | 'destructive'
    | 'success'
    | 'accent';
};

const iconButtonSizeVariants = compose(
  buttonVariants,
  cva({
    base: 'justify-center rounded-full p-0 aspect-square',
  }),
);

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = 'md', variant, color, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cx(
          iconButtonSizeVariants({ size, variant, color }),
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    );
  },
);
IconButton.displayName = 'IconButton';

const ButtonSkeleton = (props: ButtonProps) => {
  const classes = cx(
    buttonVariants({
      variant: props.variant,
      color: props.color,
      size: props.size,
    }),
    props.className,
  );

  return <Skeleton className={classes} />;
};

export default Button;

export { Button, ButtonSkeleton, buttonVariants, IconButton };

export const MotionButton = motion.create(Button);
