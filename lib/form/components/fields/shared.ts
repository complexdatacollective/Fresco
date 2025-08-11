import { compose, cva } from '~/utils/cva';

export const containerVariants = cva({
  base: 'rounded border bg-input text-input-foreground px-4 py-2',
  variants: {
    state: {
      valid: 'border-success',
      warning: 'border-warning',
      invalid: 'border-destructive',
      disabled: 'opacity-50 cursor-not-allowed',
    },
  },
});

export const focusVariants = cva({
  base: 'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary',
});

export const inputVariants = compose(
  cva({
    base: 'rounded border border-border px-4 py-2 w-full text-sm placeholder:text-muted-foreground',
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      state: {
        valid: 'border-success',
        invalid: 'border-destructive',
        warning: 'border-warning',
        disabled: 'opacity-50 cursor-not-allowed',
      },
      margin: {
        default: 'not-first:mt-4',
        none: 'mt-0',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'valid',
      margin: 'default',
    },
  }),
  focusVariants,
);
