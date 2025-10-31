'use client';

import { Switch } from '@base-ui-components/react/switch';
import { type ComponentPropsWithoutRef } from 'react';
import {
  fieldContainerVariants,
  fieldStateVariants,
  smallSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';

const toggleContainerVariants = compose(
  fieldContainerVariants,
  smallSizeVariants,
  fieldStateVariants,
  cva({
    base: cx(
      'relative inline-flex aspect-[2/1] items-center rounded-full',
      'shadow-inner',
    ),
  }),
);

const toggleThumbStyles = cx(
  'pointer-events-none block h-[88%] aspect-square absolute left-0 rounded-full bg-input shadow-sm mx-[5%]',
  'transition-transform',
  'data-[state=checked]:translate-x-[100%]',
);

type ToggleFieldProps = Omit<
  ComponentPropsWithoutRef<typeof Switch.Root>,
  'size' | 'checked' | 'onCheckedChange' | 'value'
> &
  VariantProps<typeof toggleContainerVariants> & {
    value: boolean;
    onChange?: (value: boolean) => void;
  };

export function ToggleField({
  className,
  value = false,
  size = 'md',
  onChange,
  readOnly,
  disabled,
  ...inputProps
}: ToggleFieldProps) {
  const getState = () => {
    if (disabled) return 'disabled';
    if (readOnly) return 'readOnly';
    if (inputProps['aria-invalid']) return 'invalid';
    return 'normal';
  };

  return (
    <Switch.Root
      checked={value}
      onCheckedChange={onChange}
      disabled={disabled}
      className={toggleContainerVariants({
        size,
        state: getState(),
        className,
      })}
    >
      <Switch.Thumb className={toggleThumbStyles} />
    </Switch.Root>
  );
}
