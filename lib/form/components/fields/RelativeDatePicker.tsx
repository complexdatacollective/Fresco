'use client';

import { DatePicker, type DatePickerProps } from './DatePicker/DatePicker';
import { type DateRange } from './DatePicker/helpers';

type RelativeDatePickerFieldProps = Omit<DatePickerProps, 'range' | 'minDate' | 'maxDate'> & {
  anchor?: string; // ISO date string
  before?: number; // days before anchor
  after?: number; // days after anchor
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
  ...datePickerProps
}: RelativeDatePickerFieldProps) {
  // Parse anchor date or default to today
  const anchorDate = anchor && typeof anchor === 'string' ? new Date(anchor) : new Date();
  
  // Calculate min and max dates
  const minDate = addDays(anchorDate, -before);
  const maxDate = addDays(anchorDate, after);

  // Create range for the DatePicker
  const range: DateRange = {
    start: {
      year: minDate.getFullYear(),
      month: minDate.getMonth() + 1,
      day: minDate.getDate(),
    },
    end: {
      year: maxDate.getFullYear(),
      month: maxDate.getMonth() + 1,
      day: maxDate.getDate(),
    },
  };

  return (
    <DatePicker
      range={range}
      minDate={formatDateForInput(minDate)}
      maxDate={formatDateForInput(maxDate)}
      {...datePickerProps}
    />
  );
}