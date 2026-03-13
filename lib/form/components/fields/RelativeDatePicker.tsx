import { type CreateFormFieldProps } from '../Field/types';
import InputField from './InputField';

type RelativeDatePickerFieldProps = CreateFormFieldProps<
  string,
  'input',
  {
    anchor?: string; // ISO date string
    before?: number; // days before anchor
    after?: number; // days after anchor
    size?: 'sm' | 'md' | 'lg';
    placeholder?: string;
  }
>;

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

export default function RelativeDatePickerField(
  props: RelativeDatePickerFieldProps,
) {
  const {
    anchor,
    before = 180,
    after = 0,
    value,
    onChange,
    name,
    size = 'md',
    placeholder,
    className,
    disabled,
    readOnly,
    ...rest
  } = props;

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
      name={name ?? ''}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={rest['aria-invalid']}
      aria-describedby={rest['aria-describedby']}
      aria-required={rest['aria-required']}
    />
  );
}
