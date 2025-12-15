'use client';

import { Switch } from '@base-ui/react/switch';
import { motion } from 'motion/react';
import { type ComponentPropsWithoutRef } from 'react';
import {
  controlContainerVariants,
  controlStateVariants,
  smallSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';

const toggleContainerVariants = compose(
  controlContainerVariants,
  smallSizeVariants,
  controlStateVariants,
  cva({
    base: cx(
      'bg-accent/50 border-0',
      'relative inline-flex aspect-2/1 items-center rounded-full p-[0.2em]',
      'shadow-inner',
      'focusable outline-(--input-border)',
    ),
  }),
);

const toggleThumbStyles = cx(
  'bg-input pointer-events-none block aspect-square h-full rounded-full shadow-sm',
);

type ToggleFieldProps = Omit<
  ComponentPropsWithoutRef<typeof Switch.Root>,
  'size' | 'checked' | 'onCheckedChange' | 'value'
> &
  VariantProps<typeof toggleContainerVariants> & {
    value: boolean;
    onChange?: (value: boolean) => void;
    readOnly?: boolean;
  };

export function ToggleField({
  id,
  name,
  className,
  value = false,
  size,
  onChange,
  disabled,
  readOnly,
}: ToggleFieldProps) {
  return (
    <Switch.Root
      checked={value}
      onCheckedChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      aria-checked={!!value}
      id={id}
      name={name}
      render={
        <motion.button
          className={toggleContainerVariants({
            size,
            className,
          })}
          style={{
            justifyContent: value ? 'flex-end' : 'flex-start',
          }}
          initial={false}
        />
      }
    >
      <Switch.Thumb
        render={
          <motion.span
            className={toggleThumbStyles}
            layout
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          />
        }
      />
    </Switch.Root>
  );
}
