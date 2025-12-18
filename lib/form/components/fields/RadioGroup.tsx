'use client';

import { type HTMLAttributes } from 'react';
import {
  controlLabelVariants,
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  orientationVariants,
  radioIndicatorVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';

const radioGroupWrapperVariants = compose(
  controlVariants,
  inputControlVariants,
  groupSpacingVariants,
  stateVariants,
  orientationVariants,
  cva({
    base: 'items-start',
  }),
);

const radioOptionVariants = cva({
  base: 'group flex cursor-pointer items-center transition-colors duration-200',
  variants: {
    size: {
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type RadioOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type RadioGroupProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'size' | 'onChange'
> &
  VariantProps<typeof radioGroupWrapperVariants> & {
    id?: string;
    name: string;
    options: RadioOption[];
    value?: string | number;
    defaultValue?: string | number;
    onChange?: (value: string | number) => void;
    disabled?: boolean;
    readOnly?: boolean;
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    useColumns?: boolean;
  };

export function RadioGroupField({
  id,
  className,
  name,
  options,
  value,
  defaultValue,
  onChange,
  disabled = false,
  readOnly = false,
  orientation = 'vertical',
  size = 'md',
  useColumns = false,
  ...divProps
}: RadioGroupProps) {
  const isInvalid = divProps['aria-invalid'] === 'true';

  const getState = () => {
    if (disabled) return 'disabled';
    if (readOnly) return 'readOnly';
    if (isInvalid) return 'invalid';
    return 'normal';
  };

  return (
    <div className="@container">
      <div
        id={id}
        className={radioGroupWrapperVariants({
          orientation,
          size,
          useColumns,
          state: getState(),
          className,
        })}
        role="radiogroup"
        {...divProps}
      >
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          const isOptionDisabled = disabled || option.disabled;
          const isChecked =
            value !== undefined ? value === option.value : undefined;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={radioOptionVariants({ size })}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={isChecked}
                defaultChecked={defaultValue === option.value}
                disabled={isOptionDisabled}
                readOnly={readOnly}
                onChange={(e) => {
                  if (e.target.checked && !isOptionDisabled && !readOnly) {
                    onChange?.(option.value);
                  }
                }}
                className={radioIndicatorVariants({ size })}
              />
              <span
                className={cx(
                  controlLabelVariants({ size }),
                  'cursor-[inherit] transition-colors duration-200',
                  isOptionDisabled && 'opacity-50',
                )}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default RadioGroupField;
