import { type FieldsetHTMLAttributes } from 'react';
import {
  checkboxGroupContainerVariants,
  checkboxGroupSizeVariants,
  checkboxGroupStateVariants,
  checkboxLabelVariants,
  checkboxOptionContainerVariants,
  checkboxOptionSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, type VariantProps } from '~/utils/cva';
import { Checkbox } from './Checkbox';

// Compose fieldset wrapper variants
const checkboxGroupComposedVariants = compose(
  checkboxGroupSizeVariants,
  checkboxGroupContainerVariants,
  checkboxGroupStateVariants,
);

// Compose individual checkbox option variants
const checkboxOptionComposedVariants = compose(
  checkboxOptionSizeVariants,
  checkboxOptionContainerVariants,
);

type CheckboxOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type CheckboxGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'size' | 'onChange'
> &
  VariantProps<typeof checkboxGroupComposedVariants> & {
    id?: string;
    name: string;
    options: CheckboxOption[];
    value?: (string | number)[];
    defaultValue?: (string | number)[];
    onChange?: (value: (string | number)[]) => void;
    disabled?: boolean;
    readOnly?: boolean;
    orientation?: 'horizontal' | 'vertical';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    useColumns?: boolean;
  };

export function CheckboxGroupField({
  id: _id,
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
  ...fieldsetProps
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string | number, checked: boolean) => {
    if (readOnly) return;
    if (onChange) {
      const currentValues = value ?? [];
      const newValues = checked
        ? [...currentValues, optionValue]
        : currentValues.filter((v) => v !== optionValue);
      onChange(newValues);
    }
  };

  // Determine if this is controlled or uncontrolled
  const isControlled = value !== undefined;
  const currentValues = isControlled ? value : (defaultValue ?? []);
  const isInvalid = fieldsetProps['aria-invalid'] === 'true';

  // Work out variant state based on props. Order:
  // disabled > readOnly > invalid > normal
  const getState = () => {
    if (disabled) return 'disabled';
    if (readOnly) return 'readOnly';
    if (isInvalid) return 'invalid';
    return 'normal';
  };

  return (
    <div className="@container">
      <fieldset
        {...fieldsetProps}
        className={checkboxGroupComposedVariants({
          orientation,
          size,
          useColumns,
          state: getState(),
          className,
        })}
        disabled={disabled}
        data-invalid={isInvalid}
        {...(fieldsetProps['aria-labelledby']
          ? { 'aria-labelledby': fieldsetProps['aria-labelledby'] }
          : {})}
        {...(fieldsetProps['aria-label']
          ? { 'aria-label': fieldsetProps['aria-label'] }
          : {})}
      >
        {options.map((option) => {
          const isOptionDisabled = disabled || option.disabled;
          const isChecked = currentValues.includes(option.value);

          return (
            <label
              key={option.value}
              className={checkboxOptionComposedVariants({ size })}
            >
              <Checkbox
                name={name}
                value={String(option.value)}
                {...(isControlled
                  ? { checked: isChecked }
                  : { defaultChecked: isChecked })}
                disabled={isOptionDisabled}
                readOnly={readOnly}
                onCheckedChange={(checked) => {
                  if (!isOptionDisabled && !readOnly) {
                    handleChange(option.value, checked);
                  }
                }}
                size={size}
                invalid={isInvalid}
              />
              <span className={checkboxLabelVariants()}>{option.label}</span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
