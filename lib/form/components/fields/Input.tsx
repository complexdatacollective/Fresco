/**
 * Example of a simple controlled component, designed to be used with Field and Form
 */
import { type InputHTMLAttributes } from 'react';
import { cn } from '~/utils/shadcn';
import { type FieldState } from '../../types';

// Props that all fields compatible with this system can handle
type BaseFieldProps = InputHTMLAttributes<HTMLInputElement> &
  FieldState & {
    label: string;
    hint?: string;
  };

export function InputField({
  name,
  label,
  hint,
  meta: { isValid, isTouched, isDirty, isValidating, errors },
  className,
  ...inputProps
}: BaseFieldProps) {
  const inputClasses = cn(
    'rounded border border-border px-3 py-2',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2',
    'transition-colors duration-200',
    'disabled:cursor-not-allowed disabled:opacity-50',
    isDirty && 'border-primary',
    !isValid && isTouched && 'border-destructive',
    isValid && 'border-success',
    isValidating && 'border-warning',
    className,
  );

  const showError = !isValid && isTouched && errors && errors.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      <input name={name} {...inputProps} className={inputClasses} />
      {showError && (
        <div className="text-destructive text-sm">
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
