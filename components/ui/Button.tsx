'use client';

import { Slot } from '@radix-ui/react-slot';
import { motion } from 'motion/react';
import * as React from 'react';
import {
  controlVariants,
  heightVariants,
  inlineSpacingVariants,
  proportionalLucideIconVariants,
  textSizeVariants,
  wrapperPaddingVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { Skeleton } from './skeleton';

const buttonSpecificVariants = cva({
  base: cx(
    'inline-flex shrink-0 cursor-pointer font-semibold tracking-wide',
    'items-center justify-center',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'focusable',
    'elevation-low',
    'not-disabled:active:elevation-none not-disabled:active:translate-y-[2px]',
    'transition-[background-color,border-color,color,box-shadow,opacity,translate] duration-150',
  ),
  variants: {
    variant: {
      default: 'bg-(--component-text) text-(--component-bg)',
      outline:
        'border-2 border-(--component-text) text-(--component-text) hover:enabled:bg-(--component-text) hover:enabled:text-(--component-bg)',
      text: 'text-(--component-text) hover:enabled:bg-(--component-text) hover:enabled:text-(--component-bg)',
      dashed:
        'border-2 border-dashed border-(--component-text) text-(--component-text) hover:enabled:bg-(--component-text) hover:enabled:text-(--component-bg)',
      link: 'elevation-none hover:elevation-none! text-link h-auto! border-0! p-0! underline-offset-4 hover:translate-none! hover:enabled:underline',
    },
    color: {
      default:
        '[--component-bg:var(--color-neutral-contrast)] [--component-text:var(--color-neutral)]',
      dynamic:
        'text-current [--component-bg:currentColor] [--component-text:color-mix(in_oklab,var(--published-bg,--background),currentColor_8%)]',
      primary:
        'focus:outline-primary [--component-bg:var(--color-primary-contrast)] [--component-text:var(--color-primary)]',
      secondary:
        'focus:outline-secondary [--component-bg:var(--color-secondary-contrast)] [--component-text:var(--color-secondary)]',
      warning:
        'focus:outline-warning [--component-bg:var(--color-warning-contrast)] [--component-text:var(--color-warning)]',
      info: 'focus:outline-info [--component-bg:var(--color-info-contrast)] [--component-text:var(--color-info)]',
      destructive:
        'focus:outline-destructive [--component-bg:var(--color-destructive-contrast)] [--component-text:var(--color-destructive)]',
      success:
        'focus:outline-success [--component-bg:var(--color-success-contrast)] [--component-text:var(--color-success)]',
      accent:
        'focus:outline-accent [--component-bg:var(--color-accent-contrast)] [--component-text:var(--color-accent)]',
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
      variant: ['text', 'link'],
      className: 'elevation-none',
    },
  ],
});

const buttonVariants = compose(
  heightVariants,
  textSizeVariants,
  proportionalLucideIconVariants,
  controlVariants,
  inlineSpacingVariants,
  wrapperPaddingVariants,
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
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        type={type}
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

const iconButtonVariants = compose(
  buttonVariants,
  cva({
    base: 'aspect-square justify-center rounded-full p-0!',
  }),
);

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon, className, size = 'md', variant, color, type = 'button', ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cx(iconButtonVariants({ size, variant, color }), className)}
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

export {
  Button,
  ButtonSkeleton,
  buttonVariants,
  IconButton,
  iconButtonVariants,
};

const MotionButton = motion.create(Button);

export { MotionButton };
