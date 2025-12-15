import { isEmpty } from 'es-toolkit/compat';
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

  const hasValue = isEmpty(value) === false;

  return (
    <div
      className={controlWrapperVariants({
        size,
        className: selectProps.className,
      })}
    >
      <select
        autoComplete="off"
        {...selectProps}
        name={name}
        value={value ?? ''}
        disabled={disabled}
        onChange={handleChange}
        className={cx(
          selectBackgroundVariants,
          !hasValue && 'text-input-contrast/50 italic',
          selectProps.className,
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
