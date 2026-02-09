'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';
import { cx } from '~/utils/cva';

type ProgressTestProps = {
  indicatorClasses?: string;
} & React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>;

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressTestProps
>(({ className, indicatorClasses, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cx(
      'bg-input relative h-4 w-full overflow-hidden rounded-full border',
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cx(
        'bg-primary h-full w-full flex-1 transition-all',
        indicatorClasses,
      )}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
