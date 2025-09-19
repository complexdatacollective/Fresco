import type { HTMLAttributes } from 'react';
import { type VariantProps, cva, cx } from '~/utils/cva';

const containerVariants = cva({
  base: 'mx-auto flex flex-col my-6 tablet:my-10',
  variants: {
    maxWidth: {
      'xl': 'max-w-xl',
      '3xl': 'max-w-3xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
      '8xl': 'max-w-8xl',
    },
    baseSize: {
      '60%': 'w-[60%]',
      '80%': 'w-[80%]',
      '90%': 'w-[90%]',
      '100%': 'w-[100%]',
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
