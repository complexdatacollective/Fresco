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
  base: 'text-contrast my-6 flex w-full gap-3 border border-black/10 inset-shadow-[0_3px_5px_0_rgb(0_0_0/0.15),0_-1px_2px_0_rgb(255_255_255/0.5)] last:mb-0',
  variants: {
    variant: {
      default: '',
      info: 'text-info-contrast [&>svg]:text-info-contrast bg-info [--color-link:var(--color-info-contrast)]',
      destructive:
        'text-destructive-contrast [&>svg]:text-destructive-contrast bg-destructive [--color-link:var(--color-destructive-contrast)]',
      success:
        'text-success-contrast [&>svg]:text-success-contrast bg-success [--color-link:var(--color-success-contrast)]',
      warning:
        'text-warning-contrast [&>svg]:text-warning-contrast bg-warning [--color-link:var(--color-warning-contrast)]',
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
        noContainer
        maxWidth="3xl"
        elevation="none"
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
