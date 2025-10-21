'use client';

import { Slot } from '@radix-ui/react-slot';
import { motion } from 'motion/react';
import * as React from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';
import { Skeleton } from './skeleton';

const buttonVariants = cva({
  base: cx(
    'font-semibold inline-flex items-center justify-center truncate text-nowrap rounded text-base tracking-wide transition-colors cursor-pointer',
    'disabled:cursor-not-allowed disabled:opacity-50',
    // Set the size of any child SVG icons to 1rem
    '[&>svg]:w-auto [&>svg]:h-[1rem] [&>svg]:shrink-0',
    'focusable',
  ),
  variants: {
    variant: {
      default:
        'bg-[var(--scoped-bg)] text-[var(--scoped-text)] hover:enabled:bg-[color-mix(in_oklch,var(--scoped-bg)_95%,var(--scoped-text))]',
      outline:
        'border border-[var(--scoped-bg)] text-[var(--scoped-bg)] hover:enabled:bg-[var(--scoped-bg)] hover:enabled:text-[var(--scoped-text)]',
      text: 'text-[var(--scoped-bg)] hover:enabled:bg-[var(--scoped-bg)] hover:enabled:text-[var(--scoped-text)]',
      link: 'text-[var(--scoped-bg)] hover:enabled:underline',
    },
    color: {
      default: cx(
        // bg: mix of 5% of text color and background color
        '[--scoped-bg:color-mix(in_oklab,oklch(var(--text))_6%,oklch(var(--background)))]',
        // text: use the foreground color
        '[--scoped-text:oklch(var(--text))]',
      ),
      primary:
        '[--scoped-bg:var(--color-primary)] [--scoped-text:var(--color-primary-contrast)]',
      secondary:
        '[--scoped-bg:var(--color-secondary)] [--scoped-text:var(--color-secondary-contrast)]',
      warning:
        '[--scoped-bg:var(--color-warning)] [--scoped-text:var(--color-warning-contrast)]',
      info: '[--scoped-bg:var(--color-info)] [--scoped-text:var(--color-info-contrast)]',
      destructive:
        '[--scoped-bg:var(--color-destructive)] [--scoped-text:var(--color-destructive-contrast)]',
      accent:
        '[--scoped-bg:var(--color-accent)] [--scoped-text:var(--color-accent-contrast)]',
      success:
        '[--scoped-bg:var(--color-success)] [--scoped-text:var(--color-success-contrast)]',
    },
    hasIcon: { true: 'gap-2' },
    iconPosition: {
      left: 'flex-row',
      right: 'flex-row-reverse',
    },
    size: {
      xs: 'h-8 px-3 text-xs tablet:w-auto',
      sm: 'h-8 px-4 text-sm tablet:w-auto',
      default: 'h-10 px-8 tablet:w-auto',
      lg: 'h-14 px-8 text-base tablet:w-auto',
      icon: 'flex h-10 w-10 shrink-0 rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    color: 'default',
    size: 'default',
  },
  compoundVariants: [
    {
      variant: ['outline', 'text', 'link'],
      color: 'default',
      className: 'text-text',
    },
  ],
});

export type ButtonProps = {
  variant?: VariantProps<typeof buttonVariants>['variant'];
  color?: VariantProps<typeof buttonVariants>['color'];
  size?: VariantProps<typeof buttonVariants>['size'];
  asChild?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

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
