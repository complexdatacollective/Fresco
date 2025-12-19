'use client';

import { Switch } from '@base-ui/react/switch';
import { motion } from 'motion/react';
import { type ComponentPropsWithoutRef } from 'react';
import {
  controlVariants,
  smallSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';

type ToggleState = 'normal' | 'disabled' | 'readOnly' | 'invalid';

const toggleContainerVariants = compose(
  controlVariants,
  smallSizeVariants,
  cva({
    base: cx(
      'border-0',
      'relative inline-flex aspect-2/1 items-center rounded-full p-[0.2em]',
      'shadow-inner',
      'focusable outline-(--input-border)',
      'transition-all duration-200',
    ),
    variants: {
      checked: {
        true: '',
        false: '',
      },
      state: {
        normal: 'cursor-pointer',
        disabled: 'cursor-not-allowed opacity-50',
        readOnly: 'cursor-default',
        invalid: '',
      },
    },
    compoundVariants: [
      // Normal states
      {
        checked: false,
        state: 'normal',
        class: 'bg-input-contrast/30',
      },
      {
        checked: true,
        state: 'normal',
        class: 'bg-current',
      },
      // Disabled states
      {
        checked: false,
        state: 'disabled',
        class: 'bg-input-contrast/10',
      },
      {
        checked: true,
        state: 'disabled',
        class: 'bg-input-contrast/30',
      },
      // ReadOnly states
      {
        checked: false,
        state: 'readOnly',
        class: 'bg-input-contrast/20',
      },
      {
        checked: true,
        state: 'readOnly',
        class: 'bg-input-contrast/50',
      },
      // Invalid states
      {
        checked: false,
        state: 'invalid',
        class: 'bg-input-contrast/30 outline-destructive outline-2',
      },
      {
        checked: true,
        state: 'invalid',
        class: 'outline-destructive bg-current outline-2',
      },
    ],
    defaultVariants: {
      checked: false,
      state: 'normal',
    },
  }),
);

const toggleThumbVariants = cva({
  base: cx(
    'pointer-events-none block aspect-square h-full rounded-full shadow-sm',
    'transition-colors duration-200',
  ),
  variants: {
    state: {
      normal: 'bg-input',
      disabled: 'bg-input-contrast/30',
      readOnly: 'bg-input-contrast/40',
      invalid: 'bg-input',
    },
  },
  defaultVariants: {
    state: 'normal',
  },
});

type ToggleFieldProps = Omit<
  ComponentPropsWithoutRef<typeof Switch.Root>,
  'size' | 'checked' | 'onCheckedChange' | 'value'
> &
  VariantProps<typeof toggleContainerVariants> & {
    'value': boolean;
    'onChange'?: (value: boolean) => void;
    'readOnly'?: boolean;
    'aria-invalid'?: 'true' | 'false' | boolean;
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
  ...props
}: ToggleFieldProps) {
  const isInvalid =
    props['aria-invalid'] === 'true' || props['aria-invalid'] === true;

  const getState = (): ToggleState => {
    if (disabled) return 'disabled';
    if (readOnly) return 'readOnly';
    if (isInvalid) return 'invalid';
    return 'normal';
  };

  const state = getState();

  return (
    <Switch.Root
      checked={value}
      onCheckedChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      aria-checked={!!value}
      aria-invalid={isInvalid || undefined}
      id={id}
      name={name}
      {...props}
      render={
        <motion.button
          className={toggleContainerVariants({
            size,
            checked: value,
            state,
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
            className={toggleThumbVariants({ state })}
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
