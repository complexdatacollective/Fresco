'use client';

import { useEffect, useMemo, useState } from 'react';
import { cx } from '~/utils/cva';
import { type CreateFormFieldProps } from '../Field/types';
import InputField from './InputField';
import SelectField from './Select/Native';
import type { SelectOption } from './Select/shared';

// Native <input type="date"> doesn't expose its empty-state "mm/dd/yyyy" hint
// via ::placeholder, and `:placeholder-shown` doesn't match a date input with
// no value, so `placeholder:` utilities never reach it. We conditionally apply
// muted-italic styling when the value is empty: `color`/`italic` on the input
// itself handles Firefox; the webkit-datetime-edit pseudo-element handles
// Chromium/Safari where the color property doesn't cascade through.
const emptyDateInputClass = cx(
  'text-input-contrast/50 italic',
  '[&::-webkit-datetime-edit]:text-input-contrast/50',
  '[&::-webkit-datetime-edit]:italic',
);

type DatePickerFieldProps = CreateFormFieldProps<
  string,
  'input',
  {
    type?: 'full' | 'month' | 'year';
    size?: 'sm' | 'md' | 'lg';
    min?: string;
    max?: string;
    placeholder?: string;
  }
>;

type Ymd = { year: number; month: number; day: number };

const ymdPattern = /^(\d{4})-(\d{2})-(\d{2})/;

function parseYmd(value: string): Ymd | null {
  const match = ymdPattern.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function todayYmd(): Ymd {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

const DEFAULT_MIN: Ymd = { year: 1920, month: 1, day: 1 };

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

export default function DatePickerField(props: DatePickerFieldProps) {
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

  const minYmd = useMemo(
    () => (min ? (parseYmd(min) ?? DEFAULT_MIN) : DEFAULT_MIN),
    [min],
  );
  const maxYmd = useMemo(
    () => (max ? (parseYmd(max) ?? todayYmd()) : todayYmd()),
    [max],
  );

  const [selectedYear, setSelectedYear] = useState<string | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();

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
    for (let y = maxYmd.year; y >= minYmd.year; y--) {
      arr.push({ value: y.toString(), label: y.toString() });
    }
    return arr;
  }, [minYmd.year, maxYmd.year]);

  const availableMonths = useMemo(() => {
    if (!selectedYear) return months;
    const year = parseInt(selectedYear, 10);
    let startMonth = 1;
    let endMonth = 12;
    if (year === minYmd.year) startMonth = minYmd.month;
    if (year === maxYmd.year) endMonth = maxYmd.month;
    return months.filter((m) => {
      const monthNum = parseInt(String(m.value), 10);
      return monthNum >= startMonth && monthNum <= endMonth;
    });
  }, [selectedYear, minYmd, maxYmd]);

  const handleChange = (year?: string, month?: string) => {
    const newYear = year ?? selectedYear;
    const newMonth = month ?? selectedMonth;
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    if (newYear && newMonth && onChange && name) {
      onChange(`${newYear}-${newMonth}`);
    }
  };

  const onBlur = rest.onBlur;

  if (resolutionType === 'month') {
    return (
      <div className="flex gap-2">
        <SelectField
          size="md"
          name={`${name ?? 'date'}-year`}
          options={years}
          placeholder="Year"
          value={selectedYear}
          onChange={(value) => handleChange(String(value), undefined)}
          onBlur={onBlur}
          disabled={disabled ?? readOnly}
          aria-invalid={rest['aria-invalid']}
          className="w-fit"
        />
        <SelectField
          size="md"
          name={`${name ?? 'date'}-month`}
          options={availableMonths}
          placeholder="Month"
          value={selectedMonth}
          onChange={(value) => handleChange(undefined, String(value))}
          onBlur={onBlur}
          disabled={disabled ?? readOnly ?? !selectedYear}
          aria-invalid={rest['aria-invalid']}
          className="w-fit"
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
        onChange={(v) => onChange?.(String(v))}
        onBlur={onBlur}
        name={name ?? 'year'}
        disabled={disabled ?? readOnly}
        aria-invalid={rest['aria-invalid']}
        className="w-fit"
      />
    );
  }

  return (
    <InputField
      type="date"
      size={size}
      min={min}
      max={max}
      value={value}
      onChange={(v) => onChange?.(String(v))}
      onBlur={onBlur}
      name={name ?? ''}
      placeholder={placeholder}
      className={cx(
        'outline-input-contrast',
        !value && emptyDateInputClass,
        className,
      )}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={rest['aria-invalid']}
      aria-describedby={rest['aria-describedby']}
      aria-required={rest['aria-required']}
    />
  );
}
