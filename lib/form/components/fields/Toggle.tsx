'use client';

import * as Switch from '@radix-ui/react-switch';
import { type InputHTMLAttributes } from 'react';
import { cx } from '~/utils/cva';

const toggleStyles = cx(
  'relative inline-flex h-6 w-12 items-center rounded-full',
  'bg-input-contrast/10 border-input-contrast/20',
  'transition-colors duration-300 ease-in-out',
  'focusable',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'data-[state=checked]:bg-accent',
  'shadow-inner',
);

const toggleThumbStyles = cx(
  'pointer-events-none block h-5 w-5 absolute left-0.5 rounded-full bg-background shadow-sm',
  'transition-transform duration-300 ease-in-out',
  'data-[state=checked]:translate-x-6',
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
        className="pointer-events-none absolute m-0 opacity-0"
        {...inputProps}
      />
    </Switch.Root>
  );
}
