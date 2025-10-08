'use client';

import { Check, X } from 'lucide-react';
import { type HTMLAttributes } from 'react';
import { cx } from '~/utils/cva';
import { transitionStyles } from './shared';

const buttonBaseStyles = cx(
  'flex-1 px-6 py-3 text-left rounded-md border text-base font-medium',
  'flex items-center gap-3',
  transitionStyles,
  'focus:outline-none focus:ring-2 focus:ring-accent/20',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'bg-input',
);

const roundCheckboxStyles = cx(
  'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center',
  'transition-colors',
);

const roundCheckboxPositiveStyles = cx(
  'bg-success border-success text-success-contrast',
);

const roundCheckboxNegativeStyles = cx(
  'bg-destructive border-destructive text-destructive-contrast',
);

const roundCheckboxUnselectedStyles = cx('bg-input ');

const buttonPositiveStyles = cx('border-success border-2');

const buttonNegativeStyles = cx('border-destructive border-2');

const buttonUnselectedStyles = cx('');

type BooleanFieldProps = Omit<
  HTMLAttributes<HTMLFieldSetElement>,
  'onChange'
> & {
  value?: boolean | null;
  onChange?: (value: boolean | null) => void;
  disabled?: boolean;
  noReset?: boolean;
  label?: string; // Optional label for fieldset legend
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
  label,
  options = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ],
  ...divProps
}: BooleanFieldProps) {
  return (
    <fieldset
      className={cx('w-full space-y-2 border-0 p-0', className)}
      {...divProps}
    >
      {label && <legend className="sr-only">{label}</legend>}
      <div className="flex gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          const isPositive = option.value === true;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange?.(option.value)}
              disabled={disabled}
              className={cx(
                buttonBaseStyles,
                isSelected
                  ? isPositive
                    ? buttonPositiveStyles
                    : buttonNegativeStyles
                  : buttonUnselectedStyles,
              )}
            >
              <div
                className={cx(
                  roundCheckboxStyles,
                  isSelected
                    ? isPositive
                      ? roundCheckboxPositiveStyles
                      : roundCheckboxNegativeStyles
                    : roundCheckboxUnselectedStyles,
                )}
              >
                {isSelected &&
                  (isPositive ? <Check size={16} /> : <X size={16} />)}
              </div>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
      {!noReset && (
        <button
          type="button"
          onClick={() => onChange?.(null)}
          disabled={disabled}
          className={cx(
            'text-muted-contrast text-left text-sm underline',
            'hover:text-contrast',
            transitionStyles,
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          Reset answer
        </button>
      )}
    </fieldset>
  );
}
