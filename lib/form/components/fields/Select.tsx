import { type SelectHTMLAttributes } from 'react';
import { inputVariants } from './Input';

type SelectOption = {
  value: string | number;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string;
  options: SelectOption[];
};

export function SelectField({
  options,
  placeholder,
  ...selectProps
}: SelectProps) {
  return (
    <select {...selectProps} className={inputVariants()}>
      {placeholder && (
        <option value="" selected={selectProps.value === ''}>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
