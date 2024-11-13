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
        info: 'border-info bg-info/10 [--link:var(--info)] [&>svg]:text-info',
        destructive:
          'border-destructive bg-destructive/5 text-destructive-foreground dark:border-destructive [&>svg]:text-destructive [--link:var(--destructive)]',
        success:
          'border-success bg-success/10 text-success-foreground [&>svg]:text-success-foreground [--link:var(--success-foreground)]',
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
