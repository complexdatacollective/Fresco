'use client';

import { type InputHTMLAttributes, type ReactNode } from 'react';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import {
  backgroundStyles,
  borderStyles,
  buildVariantStyles,
  cursorStyles,
  focusRingStyles,
  sizeStyles,
  textStyles,
  transitionStyles,
} from './shared';

// Focus styles for standalone input
export const standaloneFocusStyles = cx(
  borderStyles.focus,
  borderStyles.focusInvalid,
  borderStyles.focusReadOnly,
  focusRingStyles.base,
  focusRingStyles.invalid,
);

// Input element when used with wrapper (prefix/suffix)
export const inputVariants = cva({
  base: cx(
    'flex-1 min-w-0 border-0 p-0',
    'bg-input', // Match the wrapper's background
    'disabled:bg-muted', // Ensure disabled state matches wrapper
    'is-read-only:bg-muted/50', // Ensure read-only state matches wrapper
    'focus:outline-none focus:ring-0',
    transitionStyles,
    textStyles.base,
    textStyles.invalid,
    textStyles.disabled,
    textStyles.readOnly,
  ),
  variants: {
    size: {
      sm: cx(sizeStyles.sm.height, sizeStyles.sm.text, sizeStyles.sm.padding),
      md: cx(sizeStyles.md.height, sizeStyles.md.text, sizeStyles.md.padding),
      lg: cx(sizeStyles.lg.height, sizeStyles.lg.text, sizeStyles.lg.padding),
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Wrapper for input with prefix/suffix
export const inputWrapperVariants = compose(
  cva({
    base: cx(
      'group relative inline-flex w-full items-stretch overflow-hidden',
      transitionStyles,
      borderStyles.base,
      borderStyles.invalid,
      backgroundStyles.base,
      backgroundStyles.disabled,
      backgroundStyles.readOnly,
      // Focus styles using :has
      'has-[input:focus]:border-accent/50',
      'has-[input:focus-visible]:outline-none has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-accent/10 has-[input:focus-visible]:ring-offset-0',
      'has-[[aria-invalid=true]]:has-[input:focus]:border-destructive',
      'has-[[aria-invalid=true]]:has-[input:focus-visible]:ring-destructive/20',
      'has-[input:is-read-only]:has-[input:focus]:border-border',
      // Additional :has selectors for state management
      'has-[[aria-invalid=true]]:border-destructive',
      'has-[input:disabled]:bg-muted',
      'has-[input:is-read-only]:bg-muted/50',
    ),
    variants: {
      size: {
        sm: '',
        md: '',
        lg: '',
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

// Standalone input (no prefix/suffix)
export const standaloneInputVariants = compose(
  cva({
    base: cx(
      transitionStyles,
      borderStyles.base,
      borderStyles.invalid,
      backgroundStyles.base,
      backgroundStyles.disabled,
      backgroundStyles.readOnly,
      standaloneFocusStyles,
      textStyles.base,
      textStyles.invalid,
      textStyles.disabled,
      textStyles.readOnly,
      cursorStyles.disabled,
      cursorStyles.readOnly,
    ),
    variants: {
      size: {
        sm: cx(sizeStyles.sm.height, sizeStyles.sm.text, sizeStyles.sm.padding),
        md: cx(sizeStyles.md.height, sizeStyles.md.text, sizeStyles.md.padding),
        lg: cx(sizeStyles.lg.height, sizeStyles.lg.text, sizeStyles.lg.padding),
      },
      variant: {
        default: '',
        ghost: buildVariantStyles('ghost'),
        filled: buildVariantStyles('filled'),
        outline: buildVariantStyles('outline'),
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }),
);

// Prefix/suffix styles
export const affixVariants = cva({
  base: cx(
    'flex items-center justify-center shrink-0 grow-0',
    'bg-muted/50', // Subtle background for affix areas
    'text-muted-foreground',
  ),
  variants: {
    size: {
      sm: cx(sizeStyles.sm.text, sizeStyles.sm.padding),
      md: cx(sizeStyles.md.text, sizeStyles.md.padding),
      lg: cx(sizeStyles.lg.text, sizeStyles.lg.padding),
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> &
  VariantProps<typeof inputWrapperVariants> & {
    // NOTE: these cannot be 'prefix' and 'suffix' because these collide with RDFa attributes in @types/react@18.3.18
    prefixComponent?: ReactNode;
    suffixComponent?: ReactNode;
  };

export function InputField({
  className,
  size,
  variant,
  prefixComponent: prefix,
  suffixComponent: suffix,
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
