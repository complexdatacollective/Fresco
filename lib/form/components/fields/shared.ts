import { cva } from '~/utils/cva';

export const focusVariants = cva({
  base: 'transition-all duration-300 focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-input-foreground/10 focus-visible:ring-offset-0',
});

export const spacingVariants = cva({
  base: '',
  variants: {
    margin: {
      default: 'not-first:mt-4',
      none: 'mt-0',
    },
  },
  defaultVariants: {
    margin: 'default',
  },
});
