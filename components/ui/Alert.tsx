'use client';

import * as React from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';
import Surface from '../layout/Surface';
import Heading from '../typography/Heading';
import { paragraphVariants } from '../typography/Paragraph';

const alertVariants = cva({
  base: 'relative w-full text-contrast border p-4 [&>svg~*]:pl-6 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-contrast my-6',
  variants: {
    variant: {
      default: '',
      info: 'bg-info/5 border-info text-info [--color-link:var(--color-info)] [&>svg]:text-info',
      destructive:
        'bg-destructive/5 border-destructive text-destructive [&>svg]:text-destructive [--color-link:var(--color-destructive)]',
      success:
        'bg-success/5 border-success text-success [&>svg]:text-success [--color-link:var(--color-success)]',
      warning:
        'bg-warning/2 border-warning text-warning [--color-link:var(--color-warning)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <Surface
    ref={ref}
    role="alert"
    spacing="none"
    className={cx(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <Heading
    level="h4"
    variant="all-caps"
    ref={ref}
    className={cx('!m-0', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cx(paragraphVariants(), className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription, AlertTitle };
