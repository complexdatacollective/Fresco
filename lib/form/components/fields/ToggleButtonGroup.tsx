'use client';

import { type HTMLAttributes } from 'react';
import { cx } from '~/utils/cva';
import { transitionStyles } from './shared';

const toggleButtonStyles = cx(
  'relative inline-flex items-center justify-center',
  'w-36 h-36 rounded-full cursor-pointer',
  'text-center p-3 text-sm font-medium',
  'border-4 border-accent',
  transitionStyles,
  'hover:border-accent',
  'focus:outline-none focus:ring-2 focus:ring-accent/20',
  'disabled:opacity-50 disabled:cursor-not-allowed',
);

const toggleButtonSelectedStyles = cx(
  'bg-accent',
  'after:absolute after:inset-2 after:rounded-full after:bg-accent after:-z-10',
  'text-accent-foreground',
);

const toggleButtonUnselectedStyles = cx('text-foreground');

type Option = {
  label: string;
  value: string | number;
};

type ToggleButtonGroupFieldProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange'
> & {
  value?: (string | number)[];
  onChange?: (value: (string | number)[]) => void;
  disabled?: boolean;
  options?: Option[];
};

export function ToggleButtonGroupField({
  className,
  value = [],
  onChange,
  disabled = false,
  options = [],
  ...divProps
}: ToggleButtonGroupFieldProps) {
  const handleToggleOption = (optionValue: string | number) => {
    const isSelected = value.includes(optionValue);
    const newValue = isSelected
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];

    onChange?.(newValue);
  };

  return (
    <div className={cx('w-full', className)} {...divProps}>
      <div className="flex flex-wrap gap-4">
        {options.map((option) => {
          const isSelected = value.includes(option.value);

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => handleToggleOption(option.value)}
              disabled={disabled}
              className={cx(
                toggleButtonStyles,
                isSelected
                  ? toggleButtonSelectedStyles
                  : toggleButtonUnselectedStyles,
              )}
            >
              <span className="relative z-10 break-words hyphens-auto">
                {option.label}
              </span>
              {/* Hidden checkbox for form compatibility */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={undefined}
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none absolute opacity-0"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
