import { isEmpty } from 'es-toolkit/compat';
import { type SelectHTMLAttributes } from 'react';
import { nativeSelectVariants } from '~/styles/shared/controlVariants';
import { cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../../utils/getInputState';
import { type CreateFieldProps } from '../../Field/Field';
import { type SelectOption, selectWrapperVariants } from './shared';

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

export default function SelectField(props: SelectProps) {
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
        disabled={disabled ?? readOnly}
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
