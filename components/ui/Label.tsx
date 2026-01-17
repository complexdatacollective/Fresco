'use client';

import { motion } from 'motion/react';
import * as React from 'react';
import { cx } from '~/utils/cva';
import { headingVariants } from '../typography/Heading';

const Label = React.forwardRef<
  React.ElementRef<'label'>,
  React.ComponentPropsWithoutRef<'label'> & {
    required?: boolean;
  }
>(
  (
    {
      className,
      required,
      onAnimationStart: _onAnimationStart,
      onAnimationEnd: _onAnimationEnd,
      onAnimationIteration: _onAnimationIteration,
      onDrag: _onDrag,
      onDragEnd: _onDragEnd,
      onDragEnter: _onDragEnter,
      onDragExit: _onDragExit,
      onDragLeave: _onDragLeave,
      onDragOver: _onDragOver,
      onDragStart: _onDragStart,
      onDrop: _onDrop,
      ...props
    },
    ref,
  ) => (
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
  ),
);
Label.displayName = 'Label';

export { Label };
