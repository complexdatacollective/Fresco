'use client';

import { type HTMLAttributes } from 'react';
import { cx } from '~/utils/cva';
import { transitionStyles } from './shared';

const buttonBaseStyles = cx(
  'flex-1 px-6 py-3 text-center rounded-md border text-base font-medium',
  transitionStyles,
  'hover:bg-accent/10',
  'focus:outline-none focus:ring-2 focus:ring-accent/20',
  'disabled:opacity-50 disabled:cursor-not-allowed',
);

const buttonSelectedStyles = cx(
  'bg-accent text-accent-foreground',
  'border-accent',
  'hover:bg-accent/90',
);

const buttonUnselectedStyles = cx(
  'bg-input',
  'border-border',
  'hover:border-accent/50',
);

type BooleanFieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  value?: boolean | null;
  onChange?: (value: boolean | null) => void;
  disabled?: boolean;
  noReset?: boolean;
  options?: {
    label: string;
    value: boolean;
  }[];
};

export function BooleanField({
  className,
  value,
  onChange,
  disabled = false,
  noReset = false,
  options = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ],
  ...divProps
}: BooleanFieldProps) {
  return (
    <div className={cx('w-full space-y-2', className)} {...divProps}>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange?.(option.value)}
            disabled={disabled}
            className={cx(
              buttonBaseStyles,
              value === option.value
                ? buttonSelectedStyles
                : buttonUnselectedStyles,
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {!noReset && value !== null && value !== undefined && (
        <button
          type="button"
          onClick={() => onChange?.(null)}
          disabled={disabled}
          className={cx(
            'text-muted-foreground w-full text-sm',
            'hover:text-foreground',
            transitionStyles,
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          Reset answer
        </button>
      )}
    </div>
  );
}
