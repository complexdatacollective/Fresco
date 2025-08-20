'use client';

import { type InputHTMLAttributes } from 'react';
import { cx } from '~/utils/cva';

const toggleStyles = cx(
  'relative inline-flex h-8 w-14 items-center rounded-full',
  'bg-input border-2 border-border',
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/10',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'data-[state=checked]:bg-accent data-[state=checked]:border-accent',
);

const toggleThumbStyles = cx(
  'pointer-events-none block h-6 w-6 rounded-full bg-background shadow-sm',
  'ring-0 transition-transform',
  'translate-x-0.5',
  'data-[state=checked]:translate-x-[26px]',
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
    <button
      type="button"
      role="switch"
      aria-checked={value}
      data-state={value ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={() => onChange?.(!value)}
      className={cx(toggleStyles, className)}
    >
      <span
        data-state={value ? 'checked' : 'unchecked'}
        className={toggleThumbStyles}
      />
      <input
        type="checkbox"
        aria-hidden="true"
        tabIndex={-1}
        checked={value}
        disabled={disabled}
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          opacity: 0,
          margin: 0,
        }}
        {...inputProps}
      />
    </button>
  );
}
