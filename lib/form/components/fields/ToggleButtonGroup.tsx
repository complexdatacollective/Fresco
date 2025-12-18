'use client';

import * as Checkbox from '@radix-ui/react-checkbox';
import { type FieldsetHTMLAttributes } from 'react';
import {
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  orientationVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';

// Compose fieldset wrapper variants
const toggleButtonGroupComposedVariants = compose(
  controlVariants,
  inputControlVariants,
  groupSpacingVariants,
  stateVariants,
  orientationVariants,
  cva({
    base: 'items-start',
  }),
);

// Individual toggle button variants
const toggleButtonVariants = cva({
  base: cx(
    'relative inline-flex items-center justify-center',
    'h-36 w-36 cursor-pointer rounded-full',
    'p-3 text-center text-sm font-medium',
    'border-4 bg-transparent',
    'transition-all duration-200',
    'focusable',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'elevation-low',
  ),
  variants: {
    selected: {
      true: cx(
        'text-white',
        'before:absolute before:inset-1 before:-z-10 before:rounded-full',
      ),
      false: 'text-current',
    },
    catColor: {
      1: 'border-cat-1',
      2: 'border-cat-2',
      3: 'border-cat-3',
      4: 'border-cat-4',
      5: 'border-cat-5',
      6: 'border-cat-6',
      7: 'border-cat-7',
      8: 'border-cat-8',
      9: 'border-cat-9',
      10: 'border-cat-10',
    },
  },
  compoundVariants: [
    { selected: true, catColor: 1, class: 'before:bg-cat-1' },
    { selected: true, catColor: 2, class: 'before:bg-cat-2' },
    { selected: true, catColor: 3, class: 'before:bg-cat-3' },
    { selected: true, catColor: 4, class: 'before:bg-cat-4' },
    { selected: true, catColor: 5, class: 'before:bg-cat-5' },
    { selected: true, catColor: 6, class: 'before:bg-cat-6' },
    { selected: true, catColor: 7, class: 'before:bg-cat-7' },
    { selected: true, catColor: 8, class: 'before:bg-cat-8' },
    { selected: true, catColor: 9, class: 'before:bg-cat-9' },
    { selected: true, catColor: 10, class: 'before:bg-cat-10' },
  ],
  defaultVariants: {
    selected: false,
    catColor: 1,
  },
});

type ToggleButtonOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type ToggleButtonGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'size' | 'onChange'
> &
  VariantProps<typeof toggleButtonGroupComposedVariants> & {
    id?: string;
    name?: string;
    options: ToggleButtonOption[];
    value?: (string | number)[];
    defaultValue?: (string | number)[];
    onChange?: (value: (string | number)[]) => void;
    disabled?: boolean;
    readOnly?: boolean;
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    useColumns?: boolean;
  };

export function ToggleButtonGroupField({
  id,
  className,
  name,
  options = [],
  value,
  defaultValue,
  onChange,
  disabled = false,
  readOnly = false,
  orientation = 'horizontal',
  size = 'md',
  useColumns = false,
  ...fieldsetProps
}: ToggleButtonGroupProps) {
  const handleToggleOption = (optionValue: string | number) => {
    if (readOnly) return;
    if (onChange) {
      const currentValues = value ?? [];
      const isSelected = currentValues.includes(optionValue);
      const newValues = isSelected
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    }
  };

  // Determine if this is controlled or uncontrolled
  const isControlled = value !== undefined;
  const currentValues = isControlled ? value : (defaultValue ?? []);
  const isInvalid = fieldsetProps['aria-invalid'] === 'true';

  // Work out variant state based on props
  const getState = () => {
    if (disabled) return 'disabled';
    if (readOnly) return 'readOnly';
    if (isInvalid) return 'invalid';
    return 'normal';
  };

  const getCatColorIndex = (index: number) => {
    return ((index % 10) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  };

  return (
    <div className="@container">
      <fieldset
        id={id}
        {...fieldsetProps}
        className={toggleButtonGroupComposedVariants({
          orientation,
          size,
          useColumns,
          state: getState(),
          className,
        })}
        disabled={disabled}
        {...(fieldsetProps['aria-labelledby']
          ? { 'aria-labelledby': fieldsetProps['aria-labelledby'] }
          : {})}
        {...(fieldsetProps['aria-label']
          ? { 'aria-label': fieldsetProps['aria-label'] }
          : {})}
      >
        {options.map((option, index) => {
          const isOptionDisabled = disabled || option.disabled;
          const isChecked = currentValues.includes(option.value);

          return (
            <Checkbox.Root
              key={String(option.value)}
              name={name}
              value={String(option.value)}
              checked={isChecked}
              onCheckedChange={() => {
                if (!isOptionDisabled && !readOnly) {
                  handleToggleOption(option.value);
                }
              }}
              disabled={isOptionDisabled}
              className={toggleButtonVariants({
                selected: isChecked,
                catColor: getCatColorIndex(index),
              })}
            >
              <span className="relative z-10 wrap-break-word hyphens-auto">
                {option.label}
              </span>
            </Checkbox.Root>
          );
        })}
      </fieldset>
    </div>
  );
}
