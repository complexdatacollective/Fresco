/**
 * Example of a simple controlled component, designed to be used with Field and Form
 */
import { useId, type InputHTMLAttributes } from 'react';
import { type BaseFieldProps } from '../../types';
import { getInputState } from '../../utils/getInputState';
import FieldErrors from '../FieldErrors';
import Hint from '../Hint';
import { Label } from '../Label';
import { containerVariants, inputVariants } from './shared';

type InputFieldProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement>;

export function InputField({
  name,
  label,
  hint,
  meta,
  className,
  validation,
  onChange,
  ...inputProps
}: InputFieldProps) {
  const id = useId();

  const showError =
    !meta.isValid && meta.isTouched && meta.errors && meta.errors.length > 0;

  const inputVariantState = getInputState(meta);

  return (
    <div className={containerVariants({ state: inputVariantState })}>
      <Label htmlFor={id} required={inputProps.required}>
        {label}
      </Label>
      {hint && (
        <Hint id={`${id}-hint`} validation={validation}>
          {hint}
        </Hint>
      )}
      <input
        {...inputProps}
        id={id}
        name={name}
        className={inputVariants({ className, state: inputVariantState })}
        onChange={(e) => onChange(e.target.value)}
        // aria-describedby supports multiple IDs, so we can use the hint and the error ID.
        // Note: we cannot use aria-description yet, as it is not widely supported.
        aria-describedby={`${hint ? `${id}-hint` : ''} ${showError ? `${id}-error` : ''}`.trim()}
      />
      <FieldErrors id={`${id}-error`} errors={meta.errors} show={!!showError} />
    </div>
  );
}
