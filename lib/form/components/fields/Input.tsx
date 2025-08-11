/**
 * Example of a simple controlled component, designed to be used with Field and Form
 */
import { type InputHTMLAttributes, type ReactNode } from 'react';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';

export const inputVariants = cva({
  base: cx(
    'flex-1 min-w-0',
    'border-0 p-0', // Remove default border and padding

    'transition-colors duration-200',
    'bg-transparent text-input-foreground placeholder:text-input-foreground/50 placeholder:italic',
    'focus:outline-none focus:ring-0', // Remove all focus styles (handled by wrapper)
    // Invalid state styles using aria-invalid
    'aria-[invalid=true]:text-destructive',
    // Disabled state styles
    'disabled:cursor-not-allowed disabled:opacity-50',
    'disabled:text-muted-foreground disabled:placeholder:text-muted-foreground/50',
    // Read-only state styles
    'read-only:cursor-default read-only:text-muted-foreground',
  ),
  variants: {
    size: {
      sm: 'text-sm px-3',
      md: 'text-base px-4',
      lg: 'text-lg px-5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const inputWrapperVariants = compose(
  cva({
    base: cx(
      'group relative inline-flex w-full items-center rounded-lg',
      'transition-all duration-200',
      'border border-border',
      'overflow-hidden',
      'bg-input',
      // Focus styles using :has selector for when input is focused
      'has-[input:focus]:border-input-foreground/50',
      'has-[input:focus-visible]:outline-none has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-input-foreground/10 has-[input:focus-visible]:ring-offset-0',
      // Invalid state styles using aria-invalid
      'has-[[aria-invalid=true]]:border-destructive',
      'has-[[aria-invalid=true]]:has-[input:focus]:border-destructive has-[[aria-invalid=true]]:has-[input:focus-visible]:ring-destructive/20',
      // Disabled state styles
      'has-[input:disabled]:bg-muted',
      // Read-only state styles
      'has-[input:read-only]:bg-muted/50 has-[input:read-only]:has-[input:focus]:border-border',
    ),
    variants: {
      size: {
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-14',
      },
      variant: {
        default: '',
        ghost: cx(
          'border-transparent bg-transparent',
          'hover:bg-input/50',
          'has-[input:disabled]:bg-transparent has-[input:disabled]:hover:bg-transparent',
        ),
        filled: cx(
          'border-transparent bg-muted',
          'hover:bg-muted/80',
          'has-[input:disabled]:bg-muted has-[input:disabled]:hover:bg-muted',
        ),
        outline: cx(
          'bg-transparent',
          'hover:bg-input/20',
          'has-[input:disabled]:bg-transparent has-[input:disabled]:hover:bg-transparent',
        ),
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }),
);

export const affixVariants = cva({
  base: cx(
    'flex items-center justify-center shrink-0 grow-0 bg-platinum h-full',
    'text-muted-foreground',
  ),
  variants: {
    size: {
      sm: 'text-sm px-3',
      md: 'text-base px-5',
      lg: 'text-lg px-5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputWrapperVariants> & {
    prefix?: ReactNode;
    suffix?: ReactNode;
  };

// Standalone input styles (when no prefix/suffix)
export const standaloneInputVariants = compose(
  cva({
    base: cx(
      'w-full rounded-lg',
      'transition-all duration-200',
      'border border-border',
      'bg-input text-input-foreground placeholder:text-input-foreground/50 placeholder:italic',
      'focus:border-input-foreground/50',
      'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-input-foreground/10 focus-visible:ring-offset-0',
      // Invalid state styles using aria-invalid
      'aria-[invalid=true]:border-destructive aria-[invalid=true]:text-destructive',
      'aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/20',
      // Disabled state styles
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
      'disabled:text-muted-foreground disabled:placeholder:text-muted-foreground/50',
      // Read-only state styles
      'read-only:bg-muted/50 read-only:focus:border-border',
      'read-only:cursor-default read-only:text-muted-foreground',
    ),
    variants: {
      size: {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-5 py-3',
      },
      variant: {
        default: '',
        ghost: cx(
          'border-transparent bg-transparent',
          'hover:bg-input/50',
          'disabled:bg-transparent disabled:hover:bg-transparent',
        ),
        filled: cx(
          'border-transparent bg-muted',
          'hover:bg-muted/80',
          'disabled:bg-muted disabled:hover:bg-muted',
        ),
        outline: cx(
          'bg-transparent',
          'hover:bg-input/20',
          'disabled:bg-transparent disabled:hover:bg-transparent',
        ),
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }),
);

export function InputField({
  className,
  size,
  variant,
  prefix,
  suffix,
  ...inputProps
}: InputFieldProps) {
  // If no prefix or suffix, render simple input for backward compatibility
  if (!prefix && !suffix) {
    return (
      <input
        {...inputProps}
        className={standaloneInputVariants({ size, variant, className })}
      />
    );
  }

  return (
    <div className={inputWrapperVariants({ size, variant, className })}>
      {prefix && <div className={affixVariants({ size })}>{prefix}</div>}
      <input {...inputProps} className={inputVariants({ size })} />
      {suffix && <div className={affixVariants({ size })}>{suffix}</div>}
    </div>
  );
}
