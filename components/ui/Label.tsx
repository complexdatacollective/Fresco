'use client';

import * as React from 'react';
import { cx } from '~/utils/cva';
import { headingVariants } from '../typography/Heading';

const Label = React.forwardRef<
  React.ElementRef<'label'>,
  React.ComponentPropsWithoutRef<'label'> & {
    required?: boolean;
  }
>(({ className, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cx(
      'inline-block',
      headingVariants({ level: 'label' }),
      'peer-disabled:opacity-70',
      className,
    )}
    {...props}
  >
    {props.children}
    {required && (
      <span className="text-destructive" aria-hidden="true">
        {' '}
        *
      </span>
    )}
  </label>
));
Label.displayName = 'Label';

export { Label };
