import { type VariantProps, cva } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '~/utils/shadcn';

const containerVariants = cva('mx-auto flex flex-col my-10', {
  variants: {
    size: {
      small: 'w-[60%] max-w-xl',
      medium: 'w-[80%] max-w-3xl',
      large: 'w-[90%] max-w-5xl',
    },
  },
  defaultVariants: {
    size: 'medium',
  },
});

export type ContainerProps = {
  size?: VariantProps<typeof containerVariants>['size'];
} & HTMLAttributes<HTMLDivElement>;

const ResponsiveContainer = ({ children, size, className }: ContainerProps) => (
  <div className={cn(containerVariants({ size }), className)}>{children}</div>
);

export default ResponsiveContainer;
