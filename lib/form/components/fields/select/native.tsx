import { isEmpty } from 'es-toolkit/compat';
import { type SelectHTMLAttributes } from 'react';
import {
  controlVariants,
  heightVariants,
  inlineSpacingVariants,
  inputControlVariants,
  interactiveStateVariants,
  nativeSelectVariants,
  stateVariants,
  textSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../../utils/getInputState';
import { type CreateFieldProps } from '../../Field/Field';

// Wrapper variants for select elements (shared by native and styled)
export const selectWrapperVariants = compose(
  textSizeVariants,
  heightVariants,
  controlVariants,
  inputControlVariants,
  inlineSpacingVariants,
  stateVariants,
  interactiveStateVariants,
);

export type SelectOption = {
  value: string | number;
  label: string;
};

export type SelectProps = CreateFieldProps<
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'>
> &
  VariantProps<typeof selectWrapperVariants> & {
    name: string;
    value?: string | number;
    placeholder?: string;
    options: SelectOption[];
    onChange: (value: string | number) => void;
    className?: string;
  };

export function SelectField(props: SelectProps) {
  const {
    options,
    placeholder,
    size,
    name,
    disabled,
    readOnly,
    onChange,
    className,
    ...rest
  } = props;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  const hasValue = isEmpty(rest.value) === false;

  return (
    <div
      className={selectWrapperVariants({
        size,
        className: cx('w-full', className),
        state: getInputState(props),
      })}
    >
      <select
        autoComplete="off"
        {...rest}
        name={name}
        disabled={disabled || readOnly}
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
