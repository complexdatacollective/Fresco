import { compose, cx, type VariantProps } from 'cva';
import { isEmpty } from 'es-toolkit/compat';
import { type SelectHTMLAttributes } from 'react';
import { cva } from '~/utils/cva';
import { standaloneInputVariants } from './Input';

type SelectOption = {
  value: string | number;
  label: string;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  VariantProps<typeof standaloneInputVariants> & {
    placeholder?: string;
    options: SelectOption[];
  };

const selectVariants = compose(
  cva({
    base: 'w-auto',
    variants: {
      size: {
        sm: 'pr-8',
        md: 'pr-10',
        lg: 'pr-12',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }),
  standaloneInputVariants,
);

export function SelectField({
  options,
  placeholder,
  size,
  variant,
  className,
  ...selectProps
}: SelectProps) {
  return (
    <select
      {...selectProps}
      className={selectVariants({
        size,
        variant,
        className: cx(
          className,
          isEmpty(selectProps.value) && '!text-input-foreground/50 italic',
        ),
      })}
    >
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
