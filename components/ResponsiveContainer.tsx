import { type VariantProps, cva } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '~/utils/shadcn';

const containerVariants = cva('mx-auto flex flex-col my-6 md:my-10 ', {
  variants: {
    maxWidth: {
      'xl': 'max-w-xl',
      '3xl': 'max-w-3xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
    },
    baseSize: {
      '60%': 'w-[60%]',
      '80%': 'w-[80%]',
      '90%': 'w-[90%]',
      '100%': 'w-[100%]',
    },
  },
  defaultVariants: {
    maxWidth: '3xl',
    baseSize: '90%',
  },
});

export type ContainerProps = {
  maxWidth?: VariantProps<typeof containerVariants>['maxWidth'];
  baseSize?: VariantProps<typeof containerVariants>['baseSize'];
} & HTMLAttributes<HTMLDivElement>;

const ResponsiveContainer = ({
  children,
  maxWidth,
  baseSize,
  className,
}: ContainerProps) => (
  <div className={cn(containerVariants({ maxWidth, baseSize }), className)}>
    {children}
  </div>
);

export default ResponsiveContainer;
