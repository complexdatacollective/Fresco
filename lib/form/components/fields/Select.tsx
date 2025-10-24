import { compose, cx, type VariantProps } from 'cva';
import { type SelectHTMLAttributes } from 'react';
import { cva } from '~/utils/cva';
import {
  backgroundStyles,
  borderStyles,
  buildVariantStyles,
  cursorStyles,
  focusRingStyles,
  sizeStyles,
  textStyles,
  transitionStyles,
} from './shared';

export type SelectOption = {
  value: string | number;
  label: string;
};

const selectVariants = compose(
  cva({
    base: cx(
      'w-auto',
      transitionStyles,
      borderStyles.base,
      borderStyles.invalid,
      backgroundStyles.base,
      backgroundStyles.disabled,
      backgroundStyles.readOnly,
      borderStyles.focus,
      borderStyles.focusInvalid,
      borderStyles.focusReadOnly,
      focusRingStyles.base,
      focusRingStyles.invalid,
      textStyles.base,
      textStyles.invalid,
      textStyles.disabled,
      textStyles.readOnly,
      cursorStyles.disabled,
      cursorStyles.readOnly,
    ),
    variants: {
      size: {
        sm: cx(
          sizeStyles.sm.height,
          sizeStyles.sm.text,
          sizeStyles.sm.padding,
          'pr-8',
        ),
        md: cx(
          sizeStyles.md.height,
          sizeStyles.md.text,
          sizeStyles.md.padding,
          'pr-10',
        ),
        lg: cx(
          sizeStyles.lg.height,
          sizeStyles.lg.text,
          sizeStyles.lg.padding,
          'pr-12',
        ),
      },
      variant: {
        default: '',
        ghost: buildVariantStyles('ghost'),
        filled: buildVariantStyles('filled'),
        outline: buildVariantStyles('outline'),
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }),
);

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size'
> &
  VariantProps<typeof selectVariants> & {
    name: string;
    placeholder?: string;
    options: SelectOption[];
  };

// Legacy export for backward compatibility
export { selectVariants as standaloneInputVariants };

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
        className,
      })}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
