import { type SelectHTMLAttributes } from 'react';
import {
  controlWrapperVariants,
  selectBackgroundVariants,
} from '~/styles/shared/controlVariants';
import { cx, type VariantProps } from '~/utils/cva';

export type SelectOption = {
  value: string | number;
  label: string;
};

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size' | 'onChange'
> &
  VariantProps<typeof controlWrapperVariants> & {
    name: string;
    value?: string | number;
    placeholder?: string;
    options: SelectOption[];
    onChange: (value: string | number) => void;
    className?: string;
  };

export function SelectField({
  options,
  placeholder,
  size,
  onChange,
  value,
  disabled,
  name,
  ...selectProps
}: SelectProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  // Work out variant state based on props. Order:
  // disabled > readOnly > invalid > normal
  const getState = () => {
    if (disabled) return 'disabled';
    if (selectProps['aria-invalid']) return 'invalid';
    return 'normal';
  };

  return (
    <div
      className={controlWrapperVariants({
        size,
        state: getState(),
        className: selectProps.className,
      })}
    >
      <select
        {...selectProps}
        name={name}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        className={cx(
          selectBackgroundVariants,
          value === undefined ||
            value === null ||
            (value === '' && 'text-input-contrast/50 italic'),
          selectProps.className,
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
