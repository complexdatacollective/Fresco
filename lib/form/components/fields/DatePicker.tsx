'use client';

import { useEffect, useMemo, useState } from 'react';
import { type CreateFieldProps } from '../Field/Field';
import { InputField } from './InputField';
import type { SelectOption } from './Select';
import { SelectField } from './Select';

type DatePickerFieldProps = CreateFieldProps & {
  type?: 'full' | 'month' | 'year';
  value?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
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

export function DatePickerField(props: DatePickerFieldProps) {
  const {
    type: resolutionType = 'full',
    min,
    max,
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
  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(
    () => (min ? new Date(String(min)) : new Date(1920, 0, 1)),
    [min],
  );
  const maxDate = useMemo(
    () => (max ? new Date(String(max)) : today),
    [max, today],
  );

  const minYear = minDate.getFullYear();
  const maxYear = maxDate.getFullYear();

  const [selectedYear, setSelectedYear] = useState<string | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();

  // Initialize from value
  useEffect(() => {
    if (
      resolutionType === 'month' &&
      typeof value === 'string' &&
      value.includes('-')
    ) {
      const [year, month] = value.split('-');
      setSelectedYear(year);
      setSelectedMonth(month);
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
      const monthNum = parseInt(String(m.value), 10);
      return monthNum >= startMonth && monthNum <= endMonth;
    });
  }, [selectedYear, minYear, maxYear, minDate, maxDate]);

  const handleChange = (year?: string, month?: string) => {
    const newYear = year ?? selectedYear;
    const newMonth = month ?? selectedMonth;
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    if (newYear && newMonth && onChange && name) {
      onChange(`${newYear}-${newMonth}`);
    }
  };

  if (resolutionType === 'month') {
    return (
      <div className="flex w-full gap-2">
        <SelectField
          size="md"
          name={`${name ?? 'date'}-year`}
          options={years}
          placeholder="Year"
          value={selectedYear}
          onChange={(value) => handleChange(String(value), undefined)}
          disabled={disabled || readOnly}
          aria-invalid={rest['aria-invalid']}
        />
        <SelectField
          size="md"
          name={`${name ?? 'date'}-month`}
          options={availableMonths}
          placeholder="Month"
          value={selectedMonth}
          onChange={(value) => handleChange(undefined, String(value))}
          disabled={disabled || readOnly || !selectedYear}
          aria-invalid={rest['aria-invalid']}
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
        value={value}
        onChange={(value) => onChange?.(String(value))}
        name={name ?? 'year'}
        disabled={disabled || readOnly}
        aria-invalid={rest['aria-invalid']}
      />
    );
  }

  return (
    <InputField
      type="date"
      size={size}
      min={min ? String(min) : undefined}
      max={max ? String(max) : undefined}
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
