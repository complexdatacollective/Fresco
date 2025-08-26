'use client';

import { type InputHTMLAttributes, useState } from 'react';
import { DatePicker } from '~/components/ui/date-picker';

type DatePickerFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'onChange' | 'value'
> & {
  onChange?: (e: { target: { value: string } }) => void;
  value?: string;
};

export function DatePickerField({
  onChange,
  value,
  ...props
}: DatePickerFieldProps) {
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
    const isoValue = date ? date.toISOString().split('T')[0]! : '';
    onChange?.({ target: { value: isoValue } });
  };

  return (
    <DatePicker
      value={selectedDate}
      onChange={handleDateChange}
      disabled={props.disabled}
      placeholder={props.placeholder ?? 'Select a Date'}
      className={props.className}
    />
  );
}
