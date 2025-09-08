import { type VariantProps, tv } from 'tailwind-variants';
import type { ElementType, ComponentPropsWithoutRef } from 'react';
import { cn } from '~/lib/utils';

const containerVariants = tv({
  base: 'mx-4 md:mx-auto',
  variants: {
    maxWidth: {
      'xl': 'max-w-xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
    },
    baseSize: {
      '60%': 'md:w-[60%]',
      '80%': 'md:w-[80%]',
      '90%': 'md:w-[90%]',
      '100%': 'md:w-[100%]',
    },
  },
  defaultVariants: {
    maxWidth: '4xl',
    baseSize: '90%',
  },
});

type ContainerProps<T extends ElementType> = {
  as?: T;
  maxWidth?: VariantProps<typeof containerVariants>['maxWidth'];
  baseSize?: VariantProps<typeof containerVariants>['baseSize'];
  className?: string;
} & ComponentPropsWithoutRef<T>;

const ResponsiveContainer = <T extends ElementType = 'div'>({
  as,
  children,
  maxWidth,
  baseSize,
  className,
  ...props
}: ContainerProps<T>) => {
  const Component = as ?? 'div';
  return (
    <Component
      className={cn(containerVariants({ maxWidth, baseSize }), className)}
      {...props}
    >
      {children}
    </Component>
  );
};

export default ResponsiveContainer;
