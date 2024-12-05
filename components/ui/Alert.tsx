'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '~/utils/shadcn';
import Heading from './typography/Heading';
import { paragraphVariants } from './typography/Paragraph';

const alertVariants = cva(
  'relative w-full bg-card text-foreground rounded-lg border p-4 [&>svg~*]:pl-6 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: '',
        info: 'bg-info/5 border-info text-info [--color-link:var(--color-info)] [&>svg]:text-info',
        destructive:
          'bg-destructive/5 border-destructive text-destructive [&>svg]:text-destructive [--color-link:var(--color-destructive)]',
        success:
          'bg-success/5 border-success text-success [&>svg]:text-success [--color-link:var(--color-success)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <Heading
    variant="h4-all-caps"
    ref={ref}
    className={cn(className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      paragraphVariants({ variant: 'smallText', margin: 'none' }),
      className,
    )}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription, AlertTitle };
