import { type FieldsetHTMLAttributes } from 'react';
import {
  controlLabelVariants,
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  interactiveStateVariants,
  orientationVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFieldProps } from '../Field/Field';
import { Checkbox } from './Checkbox';

// Compose fieldset wrapper variants
const checkboxGroupComposedVariants = compose(
  controlVariants,
  inputControlVariants,
  groupSpacingVariants,
  stateVariants,
  interactiveStateVariants,
  orientationVariants,
  cva({
    base: 'items-start',
  }),
);

type CheckboxOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type CheckboxGroupProps = CreateFieldProps<
  Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'size' | 'onChange'>
> &
  VariantProps<typeof checkboxGroupComposedVariants> & {
    options: CheckboxOption[];
    value?: (string | number)[];
    defaultValue?: (string | number)[];
    onChange?: (value: (string | number)[]) => void;
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    useColumns?: boolean;
  };

export function CheckboxGroupField(props: CheckboxGroupProps) {
  const {
    id,
    className,
    name,
    options,
    value,
    defaultValue,
    onChange,
    orientation = 'vertical',
    size = 'md',
    useColumns = false,
    disabled,
    readOnly,
    ...fieldsetProps
  } = props;

  const isInvalid = !!fieldsetProps['aria-invalid'];

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

  return (
    <div className="@container w-full">
      <fieldset
        id={id}
        {...fieldsetProps}
        className={checkboxGroupComposedVariants({
          orientation,
          useColumns,
          state: getInputState(props),
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
        {options.map((option) => {
          const isOptionDisabled = disabled || option.disabled;
          const isChecked = currentValues.includes(option.value);

          return (
            <label
              key={option.value}
              className={cx(
                'flex items-center gap-2',
                controlLabelVariants({ size }),
              )}
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
                aria-invalid={isInvalid}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
