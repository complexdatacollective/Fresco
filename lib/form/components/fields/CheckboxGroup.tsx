import { RenderMarkdown } from '~/components/RenderMarkdown';
import {
  controlLabelVariants,
  controlVariants,
  groupOptionVariants,
  groupSpacingVariants,
  inputControlVariants,
  interactiveStateVariants,
  orientationVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';
import Checkbox from './Checkbox';

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

type CheckboxGroupProps = CreateFormFieldProps<
  (string | number)[],
  'fieldset',
  {
    options: CheckboxOption[];
    defaultValue?: (string | number)[];
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    useColumns?: boolean;
  }
> &
  VariantProps<typeof checkboxGroupComposedVariants>;

export default function CheckboxGroupField(props: CheckboxGroupProps) {
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

  const handleChange = (optionValue: string | number, checked: boolean) => {
    if (readOnly) return;
    const currentValues = value ?? [];
    const newValues = checked
      ? [...currentValues, optionValue]
      : currentValues.filter((v) => v !== optionValue);
    onChange?.(newValues);
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
          size,
          orientation,
          useColumns,
          state: getInputState(props),
          className,
        })}
        disabled={disabled}
      >
        {options.map((option) => {
          const isOptionDisabled = disabled ?? option.disabled;
          const isChecked = currentValues.includes(option.value);

          return (
            <label
              key={option.value}
              className={groupOptionVariants({
                size,
                disabled: isOptionDisabled,
              })}
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
              />
              <span
                className={cx(
                  controlLabelVariants({ size }),
                  'cursor-[inherit] transition-colors duration-200',
                  isOptionDisabled && 'opacity-50',
                )}
              >
                <RenderMarkdown>{option.label}</RenderMarkdown>
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
