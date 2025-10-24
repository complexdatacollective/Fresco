'use client';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  type LucideIcon,
} from 'lucide-react';
import * as React from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';
import Surface from '../layout/Surface';
import Heading from '../typography/Heading';
import { paragraphVariants } from '../typography/Paragraph';

const alertVariants = cva({
  base: 'w-full text-contrast border flex gap-3 my-6',
  variants: {
    variant: {
      default: '',
      info: 'bg-info/3 border-info text-info [--color-link:var(--color-info)] [&>svg]:text-info',
      destructive:
        'bg-destructive/5 border-destructive text-destructive [&>svg]:text-destructive [--color-link:var(--color-destructive)]',
      success:
        'bg-success/1 border-success text-success [&>svg]:text-success [--color-link:var(--color-success)]',
      warning:
        'bg-warning/1 border-warning text-warning [&>svg]:text-warning [--color-link:var(--color-warning)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const variantIcons: Record<
  NonNullable<VariantProps<typeof alertVariants>['variant']>,
  LucideIcon | null
> = {
  default: null,
  info: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
};

const variantAriaLabels: Record<
  NonNullable<VariantProps<typeof alertVariants>['variant']>,
  string
> = {
  default: 'Notice',
  info: 'Information',
  destructive: 'Error',
  success: 'Success',
  warning: 'Warning',
};

type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    icon?: LucideIcon | null | false;
  };

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', icon, children, ...props }, ref) => {
    const IconComponent =
      icon === false ? null : (icon ?? variantIcons[variant]);
    const ariaLabel = variantAriaLabels[variant];
    const ariaLive = variant === 'destructive' ? 'assertive' : 'polite';

    return (
      <Surface
        ref={ref}
        role="alert"
        aria-live={ariaLive}
        aria-atomic="true"
        aria-label={ariaLabel}
        spacing="sm"
        className={cx(alertVariants({ variant }), className)}
        {...props}
      >
        {IconComponent && (
          <IconComponent
            className="tablet:block mt-[0.33em] hidden h-4 w-4 shrink-0" // mt is optical adjustment so that the SVG aligns with the heading
            aria-hidden="true"
          />
        )}
        <div>{children}</div>
      </Surface>
    );
  },
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <Heading
    level="h4"
    variant="all-caps"
    ref={ref}
    className={className}
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
