import { type SelectHTMLAttributes } from 'react';
import {
  controlWrapperVariants,
  selectBackgroundVariants,
} from '~/styles/shared/controlVariants';
import { cx, type VariantProps } from '~/utils/cva';

export type SelectOption<T extends string | number = string | number> = {
  value: T;
  label: string;
};

export type SelectProps<T extends string | number = string | number> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size' | 'onChange'
> &
  VariantProps<typeof controlWrapperVariants> & {
    name: string;
    value?: T;
    placeholder?: string;
    options: SelectOption<T>[];
    onChange: (value: T) => void;
    className?: string;
  };

export function SelectField<T extends string | number = string | number>({
  options,
  placeholder,
  size,
  onChange,
  value,
  disabled,
  name,
  ...selectProps
}: SelectProps<T>) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    // Find the matching option to get the correctly typed value
    const matchedOption = options.find(
      (opt) => String(opt.value) === selectedValue,
    );
    if (matchedOption) {
      onChange(matchedOption.value);
    }
  };

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
        value={value}
        disabled={disabled}
        onChange={handleChange}
        className={cx(
          selectBackgroundVariants,
          selectProps.className,
          (value === undefined || value === null || value === '') &&
            'text-input-contrast/50 italic',
        )}
      >
        {placeholder && (
          <option
            value=""
            disabled
            selected={value === undefined || value === null || value === ''}
          >
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
