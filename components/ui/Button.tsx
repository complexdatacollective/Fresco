import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '~/utils/shadcn';
import { Skeleton } from './skeleton';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-nowrap truncate text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-primary hover:bg-primary/90 text-primary-foreground',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
        info: 'bg-info text-info-foreground hover:bg-info/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'bg-transparent hover:bg-accent hover:text-accent-foreground border',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:text-accent',
        tableHeader: 'hover:text-accent -ml-6 data-[state=open]:text-accent',
        link: 'underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 py-2',
        xs: 'h-6 px-3 text-xs',
        sm: 'h-8 px-4',
        lg: 'h-12 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
    compoundVariants: [
      {
        variant: 'tableHeader',
        size: 'sm',
        className: '-ml-4',
      },
    ],
  },
);

export type ButtonProps = {
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

const ButtonSkeleton = (props: ButtonProps) => {
  const classes = cn(
    buttonVariants({ variant: props.variant, size: props.size }),
    props.className,
  );

  return <Skeleton className={classes} />;
};

export { Button, ButtonSkeleton, buttonVariants };
