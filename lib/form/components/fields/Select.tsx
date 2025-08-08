import { useId, type SelectHTMLAttributes } from 'react';
import { type BaseFieldProps } from '../../types';
import { getInputState } from '../../utils/getInputState';
import FieldErrors from '../FieldErrors';
import Hint from '../Hint';
import { Label } from '../Label';
import { containerVariants, inputVariants } from './shared';

type SelectOption = {
  value: string | number;
  label: string;
};

type BaseSelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  BaseFieldProps<SelectOption['value']> & {
    options: SelectOption[];
  };

export function SelectField({
  name,
  label,
  hint,
  meta,
  className,
  options,
  placeholder,
  value,
  onChange,
  validation,
  ...restProps
}: BaseSelectProps) {
  const id = useId();

  const showError =
    !meta.isValid && meta.isTouched && meta.errors && meta.errors.length > 0;

  const inputVariantState = getInputState(meta);

  return (
    <div className={containerVariants({ state: inputVariantState })}>
      <Label htmlFor={id}>{label}</Label>
      {hint && (
        <Hint id={`${id}-hint`} validation={validation}>
          {hint}
        </Hint>
      )}
      <select
        id={id}
        name={name}
        value={value as string | number | undefined}
        onChange={onChange}
        className={inputVariants({ state: inputVariantState, className })}
        {...restProps}
        aria-invalid={!!showError}
        aria-describedby={
          hint || showError
            ? `${hint ? `${name}-hint` : ''} ${showError ? `${name}-error` : ''}`.trim()
            : undefined
        }
      >
        {placeholder && (
          <option value="" selected={value === ''}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldErrors id={`${id}-error`} errors={meta.errors} show={!!showError} />
    </div>
  );
}
