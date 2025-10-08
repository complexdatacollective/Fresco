'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';
import { cx } from '~/utils/cva';

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean;
  }
>(({ className, required, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cx('text-base font-bold peer-disabled:opacity-70', className)}
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
