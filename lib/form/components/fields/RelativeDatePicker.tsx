'use client';

import { type InputHTMLAttributes, useState } from 'react';
import { DatePicker } from '~/components/ui/date-picker';

type RelativeDatePickerFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'min' | 'max' | 'size' | 'onChange' | 'value'
> & {
  anchor?: string; // ISO date string
  before?: number; // days before anchor
  after?: number; // days after anchor
  onChange?: (e: { target: { value: string } }) => void;
  value?: string;
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}


export function RelativeDatePickerField({
  anchor,
  before = 180,
  after = 0,
  onChange,
  value,
  ...props
}: RelativeDatePickerFieldProps) {
  // Parse anchor date or default to today
  const anchorDate = anchor && typeof anchor === 'string' ? new Date(anchor) : new Date();
  
  // Calculate min and max dates
  const minDate = addDays(anchorDate, -before);
  const maxDate = addDays(anchorDate, after);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (value) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  });

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    // Convert to ISO string format for form compatibility
    const isoValue: string = date ? date.toISOString().split('T')[0]! : '';
    onChange?.({ target: { value: isoValue } });
  };

  return (
    <DatePicker
      value={selectedDate}
      onChange={handleDateChange}
      disabled={props.disabled}
      placeholder={props.placeholder ?? 'Select a Date'}
      className={props.className}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}