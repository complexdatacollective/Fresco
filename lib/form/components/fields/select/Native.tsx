import { isEmpty } from 'es-toolkit/compat';
import { nativeSelectVariants } from '~/styles/shared/controlVariants';
import { cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../../utils/getInputState';
import { type CreateFormFieldProps } from '../../Field/Field';
import { type SelectOption, selectWrapperVariants } from './shared';

export type SelectProps = CreateFormFieldProps<
  string | number,
  'select',
  {
    placeholder?: string;
    options: SelectOption[];
  }
> &
  VariantProps<typeof selectWrapperVariants>;

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
    value,
    ...rest
  } = props;

  // Normalize undefined to "" so the placeholder option is selected
  const normalizedValue = value ?? '';

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    onChange?.(selectedValue);
  };

  const hasValue = isEmpty(value) === false;

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
        value={normalizedValue}
        disabled={disabled ?? readOnly}
        onChange={handleChange}
        className={cx(
          'w-full',
          nativeSelectVariants(),
          !hasValue && 'text-input-contrast/50 italic',
        )}
      >
        {placeholder && (
          <option value="">
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
