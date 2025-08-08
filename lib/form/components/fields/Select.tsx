import { type SelectHTMLAttributes } from 'react';
import { cn } from '~/utils/shadcn';
import { type BaseFieldProps } from '../../types';
import { FieldError } from '../FieldError';

type SelectOption = {
  value: string | number;
  label: string;
};

type BaseSelectProps = BaseFieldProps<string | number> &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: SelectOption[];
  };

export function SelectField({
  name,
  label,
  hint,
  meta: { isTouched, isValidating, errors },
  className,
  options,
  placeholder,
  value,
  onChange,
  onBlur,
  ...restProps
}: BaseSelectProps) {
  const hasError = isTouched && errors && errors.length > 0;

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {hint && (
        <p className="mb-1 text-sm text-gray-500" id={`${name}-hint`}>
          {hint}
        </p>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={cn(
          'block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:ring-2 focus:outline-none',
          hasError
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          isValidating && 'opacity-60',
          className,
        )}
        {...restProps}
        aria-invalid={!!hasError}
        aria-describedby={
          hint || hasError
            ? `${hint ? `${name}-hint` : ''} ${hasError ? `${name}-error` : ''}`.trim()
            : undefined
        }
      >
        {placeholder && (
          <option value="" selected={!value}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError errors={errors} show={!!hasError} />
    </div>
  );
}
