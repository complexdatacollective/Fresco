import type { HTMLAttributes } from 'react';
import { type VariantProps, cva, cx } from '~/utils/cva';

const containerVariants = cva({
  base: '@container tablet:mx-auto flex flex-col my-6 tablet:my-10 mx-2 grow',
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
      '100%': 'tablet:w-[100%]',
      'content': 'max-w-fit px-6',
    },
  },
  defaultVariants: {
    maxWidth: '3xl',
    baseSize: '90%',
  },
});

type ContainerProps = {
  maxWidth?: VariantProps<typeof containerVariants>['maxWidth'];
  baseSize?: VariantProps<typeof containerVariants>['baseSize'];
} & HTMLAttributes<HTMLDivElement>;

const ResponsiveContainer = ({
  children,
  maxWidth,
  baseSize,
  className,
}: ContainerProps) => (
  <div className={cx(containerVariants({ maxWidth, baseSize }), className)}>
    {children}
  </div>
);

export default ResponsiveContainer;
