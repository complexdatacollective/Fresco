import { compose, cva } from '~/utils/cva';

export const containerVariants = cva({
  base: 'rounded border bg-input text-input-foreground px-4 py-2 flex flex-col gap-2',
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
  base: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
});

export const inputVariants = compose(
  cva({
    base: 'rounded border border-border px-4 py-2',
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
    },
    defaultVariants: {
      size: 'md',
      state: 'valid',
    },
  }),
  focusVariants,
);
