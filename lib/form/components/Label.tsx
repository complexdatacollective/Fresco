'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';
import { headingVariants } from '~/components/ui/typography/Heading';
import { cx, type VariantProps } from '~/utils/cva';

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean;
  } & VariantProps<typeof headingVariants>
>(({ className, required, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cx(headingVariants({ variant: 'label' }), className)}
    {...props}
  >
    {props.children}
    {required && (
      <span className="text-destructive" aria-hidden="true">
        {' '}
        *
      </span>
    )}
  </LabelPrimitive.Root>
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
