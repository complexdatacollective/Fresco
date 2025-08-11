import { type SelectHTMLAttributes } from 'react';
import { standaloneInputVariants } from './Input';

type SelectOption = {
  value: string | number;
  label: string;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string;
  options: SelectOption[];
};

export function SelectField({
  options,
  placeholder,
  ...selectProps
}: SelectProps) {
  return (
    <select {...selectProps} className={standaloneInputVariants()}>
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
