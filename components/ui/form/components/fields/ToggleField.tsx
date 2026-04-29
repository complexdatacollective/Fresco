'use client';

import { Switch } from '@base-ui/react/switch';
import { motion } from 'motion/react';
import {
  controlVariants,
  smallSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';

const toggleContainerVariants = compose(
  controlVariants,
  smallSizeVariants,
  cva({
    base: cx(
      'border-0',
      'relative inline-flex aspect-2/1 items-center rounded-full p-[0.2em]',
      'inset-surface',
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
        class: 'bg-success',
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

type ToggleFieldProps = CreateFormFieldProps<
  boolean,
  'button',
  VariantProps<typeof toggleContainerVariants>
>;

export default function ToggleField(props: ToggleFieldProps) {
  const {
    id,
    name,
    className,
    value = false,
    size,
    onChange,
    disabled,
    readOnly,
    onBlur,
    'aria-required': ariaRequired,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    'aria-disabled': ariaDisabled,
    'aria-readonly': ariaReadonly,
  } = props;

  const isInvalid = !!ariaInvalid;
  const state = getInputState(props);

  return (
    <Switch.Root
      checked={value}
      onCheckedChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      aria-checked={!!value}
      aria-invalid={isInvalid || undefined}
      aria-required={ariaRequired}
      aria-describedby={ariaDescribedBy}
      aria-disabled={ariaDisabled}
      aria-readonly={ariaReadonly}
      onBlur={onBlur}
      id={id}
      name={name}
      nativeButton
      render={
        <button
          className={toggleContainerVariants({
            size,
            checked: value,
            state,
            className,
          })}
          style={{
            justifyContent: value ? 'flex-end' : 'flex-start',
          }}
        />
      }
    >
      <Switch.Thumb
        render={
          <motion.span
            className={toggleThumbVariants({ state })}
            layout
            layoutDependency={value}
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
