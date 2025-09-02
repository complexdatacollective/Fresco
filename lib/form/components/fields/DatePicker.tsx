'use client';

import { type InputHTMLAttributes, useEffect, useMemo, useState } from 'react';
import { InputField } from './Input';
import type { SelectOption } from './Select';
import { SelectField } from './Select';

type DatePickerFieldProps = Omit<
  | InputHTMLAttributes<HTMLInputElement>
  | InputHTMLAttributes<HTMLSelectElement>,
  'size'
> & {
  type?: 'full' | 'month' | 'year';
};

const months: SelectOption[] = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function DatePickerField({
  type: resolutionType = 'full',
  min,
  max,
  value,
  onChange,
  name,
  ...props
}: DatePickerFieldProps) {
  const today = new Date();

  const minDate = min ? new Date(min) : new Date(1920, 0, 1);
  const maxDate = max ? new Date(max) : today;

  const minYear = minDate.getFullYear();
  const maxYear = maxDate.getFullYear();

  // Internal state for month/year
  const [selectedYear, setSelectedYear] = useState<string | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();

  // Initialize from value
  useEffect(() => {
    if (resolutionType === 'month' && value && typeof value === 'string') {
      const [year, month] = value.split('-');
      if (year) setSelectedYear(year);
      if (month) setSelectedMonth(month);
    }
  }, [value, resolutionType]);

  const years = useMemo(() => {
    const arr: SelectOption[] = [];
    for (let y = maxYear; y >= minYear; y--)
      arr.push({ value: y.toString(), label: y.toString() });
    return arr;
  }, [minYear, maxYear]);

  const availableMonths = useMemo(() => {
    if (!selectedYear) return months;
    const year = parseInt(selectedYear, 10);
    let startMonth = 1;
    let endMonth = 12;
    if (year === minYear) startMonth = minDate.getMonth() + 1;
    if (year === maxYear) endMonth = maxDate.getMonth() + 1;
    return months.filter((m) => {
      const monthNum = parseInt(m.value, 10);
      return monthNum >= startMonth && monthNum <= endMonth;
    });
  }, [selectedYear, minYear, maxYear, minDate, maxDate]);

  console.log({ selectedYear, selectedMonth });

  if (resolutionType === 'month') {
    return (
      <div className="flex gap-2">
        <SelectField
          size="md"
          options={years}
          placeholder="Year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          disabled={props.disabled}
          required={props.required}
        />
        <SelectField
          size="md"
          options={availableMonths}
          placeholder="Month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          disabled={props.disabled}
          required={props.required}
        />
        <InputField
          hidden
          name={name}
          value={`${selectedYear}-${selectedMonth}`}
          onChange={onChange}
          {...props}
        />
      </div>
    );
  }

  if (resolutionType === 'year') {
    return (
      <SelectField
        size="md"
        options={years}
        placeholder="Year"
        value={value as string}
        onChange={onChange}
        name={name}
        disabled={props.disabled}
        required={props.required}
      />
    );
  }

  return (
    <InputField
      type="date"
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      name={name}
      {...props}
    />
  );
}
