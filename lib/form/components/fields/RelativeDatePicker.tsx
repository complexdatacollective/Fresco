'use client';

import { InputField } from './InputField';

type RelativeDatePickerFieldProps = {
  'anchor'?: string; // ISO date string
  'before'?: number; // days before anchor
  'after'?: number; // days after anchor
  'value'?: string;
  'onChange'?: (value: string) => void;
  'name'?: string;
  'size'?: 'sm' | 'md' | 'lg';
  'disabled'?: boolean;
  'required'?: boolean;
  'placeholder'?: string;
  'className'?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'readOnly'?: boolean;
};

function formatDateForInput(date: Date): string {
  const isoString = date.toISOString();
  const datePart = isoString.split('T')[0];
  if (!datePart) {
    throw new Error('Invalid date format');
  }
  return datePart;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function RelativeDatePickerField({
  anchor,
  before = 180,
  after = 0,
  value,
  onChange,
  name,
  size = 'md',
  disabled,
  required,
  placeholder,
  className,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  readOnly,
}: RelativeDatePickerFieldProps) {
  // Parse anchor date or default to today
  const anchorDate =
    anchor && typeof anchor === 'string' ? new Date(anchor) : new Date();

  // Calculate min and max dates
  const minDate = addDays(anchorDate, -before);
  const maxDate = addDays(anchorDate, after);

  return (
    <InputField
      type="date"
      size={size}
      min={formatDateForInput(minDate)}
      max={formatDateForInput(maxDate)}
      value={value}
      onChange={(value) => onChange?.(String(value))}
      name={name}
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      className={className}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
      readOnly={readOnly}
    />
  );
}
