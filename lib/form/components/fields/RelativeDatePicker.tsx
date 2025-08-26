'use client';

import { type InputHTMLAttributes } from 'react';
import { InputField } from './Input';

type RelativeDatePickerFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'min' | 'max' | 'size'
> & {
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

  return (
    <InputField
      type="date"
      min={formatDateForInput(minDate)}
      max={formatDateForInput(maxDate)}
      {...datePickerProps}
    />
  );
}