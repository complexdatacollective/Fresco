'use client';

import { motion } from 'motion/react';
import * as React from 'react';
import { cx } from '~/utils/cva';
import { headingVariants } from '../typography/Heading';

const Label = React.forwardRef<
  React.ElementRef<typeof motion.label>,
  React.ComponentPropsWithoutRef<typeof motion.label> & {
    required?: boolean;
  }
>(({ className, required, ...props }, ref) => (
  <motion.label
    layout
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
  </motion.label>
));
Label.displayName = 'Label';

export { Label };
