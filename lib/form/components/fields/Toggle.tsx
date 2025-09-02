'use client';

import * as Switch from '@radix-ui/react-switch';
import { type InputHTMLAttributes } from 'react';
import { cx } from '~/utils/cva';

const toggleStyles = cx(
  'relative inline-flex h-8 w-16 items-center rounded-full',
  'bg-primary',
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/10',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'data-[state=checked]:bg-accent data-[state=checked]:border-accent',
);

const toggleThumbStyles = cx(
  'pointer-events-none block h-8 w-8 rounded-full bg-background shadow-sm',
  'ring-0 transition-transform',
  'data-[state=checked]:translate-x-[32px]',
);

type ToggleFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange' | 'value'
> & {
  value?: boolean;
  onChange?: (value: boolean) => void;
};

export function ToggleField({
  className,
  value = false,
  onChange,
  disabled,
  ...inputProps
}: ToggleFieldProps) {
  return (
    <Switch.Root
      checked={value}
      onCheckedChange={onChange}
      disabled={disabled}
      className={cx(toggleStyles, className)}
    >
      <Switch.Thumb className={toggleThumbStyles} />
      <input
        type="checkbox"
        aria-hidden="true"
        tabIndex={-1}
        checked={value}
        disabled={disabled}
        readOnly
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          opacity: 0,
          margin: 0,
        }}
        {...inputProps}
      />
    </Switch.Root>
  );
}
