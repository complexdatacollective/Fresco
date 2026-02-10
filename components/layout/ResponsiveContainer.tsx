import type { HTMLAttributes } from 'react';
import { type VariantProps, cva, cx } from '~/utils/cva';

const responsiveContainerVariants = cva({
  base: 'tablet:mx-auto flex grow flex-col',
  variants: {
    maxWidth: {
      'sm': 'max-w-sm',
      'md': 'max-w-md',
      'lg': 'max-w-lg',
      'xl': 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
      'none': '',
      'full': 'max-w-full',
    },
    baseSize: {
      '60%': 'w-[60%]',
      '80%': 'w-[80%]',
      '90%': 'w-[90%]',
      '100%': 'w-full',
      'content': 'w-fit max-w-full',
    },
    container: {
      true: '@container',
      false: '',
    },
  },
  defaultVariants: {
    maxWidth: '6xl',
    baseSize: '100%',
    container: true,
  },
});

export type ResponsiveContainerProps = VariantProps<
  typeof responsiveContainerVariants
> &
  HTMLAttributes<HTMLDivElement>;

const ResponsiveContainer = ({
  children,
  maxWidth,
  baseSize,
  container,
  className,
}: ResponsiveContainerProps) => (
  <div
    className={cx(
      responsiveContainerVariants({ maxWidth, baseSize, container }),
      className,
    )}
  >
    {children}
  </div>
);

export default ResponsiveContainer;
