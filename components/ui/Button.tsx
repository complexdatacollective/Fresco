'use client';

import { Slot } from '@radix-ui/react-slot';
import { motion } from 'motion/react';
import * as React from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';
import { Skeleton } from './skeleton';

const buttonVariants = cva({
  base: cx(
    'font-semibold inline-flex items-center justify-center truncate text-nowrap rounded tracking-wide transition-colors duration-300 cursor-pointer shrink-0',
    'disabled:cursor-not-allowed disabled:opacity-50',
    // Set the size of any child SVG icons to 1rem
    '[&>svg]:w-auto [&>svg]:max-h-full [&>svg]:shrink-0',
    'focusable',
  ),
  variants: {
    variant: {
      default:
        'bg-[var(--component-text)] text-[var(--component-bg)] hover:enabled:bg-[color-mix(in_oklab,var(--component-text)_90%,var(--component-bg))]',
      outline:
        'border border-[var(--component-text)] text-[var(--component-text)] hover:enabled:bg-[var(--component-text)] hover:enabled:text-[var(--component-bg)]',
      text: 'text-[var(--component-text)] hover:enabled:bg-[var(--component-text)] hover:enabled:text-[var(--component-bg)]',
      link: 'text-[var(--component-text)] hover:enabled:underline',
      dashed:
        'border border-[var(--component-text)] border-dashed text-[var(--component-text)] hover:enabled:border-solid',
    },
    color: {
      default: cx(
        '[--component-text:currentColor]',
        '[--component-bg:var(--published-bg)]',
      ),
      primary:
        '[--component-text:var(--color-primary)] [--component-bg:var(--color-primary-contrast)]',
      secondary:
        '[--component-text:var(--color-secondary)] [--component-bg:var(--color-secondary-contrast)]',
      warning:
        '[--component-text:var(--color-warning)] [--component-bg:var(--color-warning-contrast)]',
      info: '[--component-text:var(--color-info)] [--component-bg:var(--color-info-contrast)]',
      destructive:
        '[--component-text:var(--color-destructive)] [--component-bg:var(--color-destructive-contrast)]',
      success:
        '[--component-text:var(--color-success)] [--component-bg:var(--color-success-contrast)]',
    },
    hasIcon: { true: 'gap-2' },
    iconPosition: {
      left: 'flex-row',
      right: 'flex-row-reverse',
    },
    size: {
      xs: 'h-8 px-3 text-xs tablet:w-auto',
      sm: 'h-8 px-4 text-sm tablet:w-auto',
      default: 'h-10 text-base px-8 tablet:w-auto',
      lg: 'h-14 px-8 text-lg tablet:w-auto',
      icon: 'flex h-10 w-10 shrink-0 rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    color: 'default',
    size: 'default',
    hasIcon: false,
    iconPosition: 'left',
  },
  compoundVariants: [
    {
      color: 'default',
      variant: 'default',
      className:
        '[--component-text:color-mix(in_oklab,currentColor_20%,var(--published-bg))] [--component-bg:currentColor]',
    },
    {
      variant: ['dashed', 'default', 'outline'],
      className: 'elevation-low',
    },
  ],
});

type BaseButtonProps = {
  variant?: VariantProps<typeof buttonVariants>['variant'];
  color?: VariantProps<typeof buttonVariants>['color'];
  asChild?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
};

type IconButtonProps = BaseButtonProps & {
  'size': 'icon';
  'aria-label': string;
  'children'?: never;
} & Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'aria-label'
  >;

type TextButtonProps = BaseButtonProps & {
  size?: 'xs' | 'sm' | 'default' | 'lg';
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export type ButtonProps = IconButtonProps | TextButtonProps;

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

export { Button, ButtonSkeleton, buttonVariants };

export const MotionButton = motion.create(Button);
