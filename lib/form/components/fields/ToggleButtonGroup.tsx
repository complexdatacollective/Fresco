'use client';

import * as Checkbox from '@radix-ui/react-checkbox';
import { type HTMLAttributes } from 'react';
import { transitionStyles } from '~/styles/shared/controlVariants';
import { cx } from '~/utils/cva';

const toggleButtonStyles = cx(
  'relative inline-flex items-center justify-center',
  'h-36 w-36 cursor-pointer rounded-full',
  'p-3 text-center text-sm font-medium',
  'border-accent border-4',
  transitionStyles,
  'focusable',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'text-accent-contrast',
);

const toggleButtonSelectedStyles = cx(
  'bg-accent',
  'after:bg-accent after:absolute after:inset-2 after:-z-10 after:rounded-full',
);

const toggleButtonUnselectedStyles = cx('text-accent-contrast bg-primary');

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
            <Checkbox.Root
              key={String(option.value)}
              checked={isSelected}
              onCheckedChange={() => handleToggleOption(option.value)}
              disabled={disabled}
              className={cx(
                toggleButtonStyles,
                isSelected
                  ? toggleButtonSelectedStyles
                  : toggleButtonUnselectedStyles,
              )}
            >
              <span className="relative z-10 wrap-break-word hyphens-auto">
                {option.label}
              </span>
            </Checkbox.Root>
          );
        })}
      </div>
    </div>
  );
}
