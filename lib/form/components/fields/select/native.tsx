import { isEmpty } from 'es-toolkit/compat';
import { type SelectHTMLAttributes } from 'react';
import {
  controlVariants,
  inlineSpacingVariants,
  inputControlVariants,
  nativeSelectVariants,
  sizeVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cx, type VariantProps } from '~/utils/cva';

// Wrapper variants for select elements (shared by native and styled)
export const selectWrapperVariants = compose(
  sizeVariants,
  controlVariants,
  inputControlVariants,
  inlineSpacingVariants,
  stateVariants,
);

export type SelectOption = {
  value: string | number;
  label: string;
};

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size' | 'onChange'
> &
  VariantProps<typeof selectWrapperVariants> & {
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
  name,
  ...selectProps
}: SelectProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    selectProps.onChange(selectedValue);
  };

  const hasValue = isEmpty(selectProps.value) === false;

  const getState = () => {
    if (selectProps.disabled) return 'disabled';
    if (selectProps['aria-invalid']) return 'invalid';
    return 'normal';
  };

  return (
    <div
      className={selectWrapperVariants({
        size,
        className: cx('w-full', selectProps.className),
        state: getState(),
      })}
    >
      <select
        autoComplete="off"
        {...selectProps}
        name={name}
        onChange={handleChange}
        className={cx(
          'w-full',
          nativeSelectVariants(),
          !hasValue && 'text-input-contrast/50 italic',
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
