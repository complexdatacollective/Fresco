import type { HTMLAttributes } from 'react';
import { type VariantProps, cva, cx } from '~/utils/cva';

const responsiveContainerVariants = cva({
  base: 'tablet:mx-auto @container flex grow flex-col',
  variants: {
    maxWidth: {
      'xl': 'max-w-xl',
      '3xl': 'max-w-3xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
    },
    baseSize: {
      '60%': 'tablet:w-[60%]',
      '80%': 'tablet:w-[80%]',
      '90%': 'tablet:w-[90%]',
      '100%': 'tablet:w-full',
      'content': 'max-w-fit px-6',
    },
  },
  defaultVariants: {
    maxWidth: '6xl',
    baseSize: '100%',
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
  className,
}: ResponsiveContainerProps) => (
  <div
    className={cx(
      responsiveContainerVariants({ maxWidth, baseSize }),
      className,
    )}
  >
    {children}
  </div>
);

export default ResponsiveContainer;
