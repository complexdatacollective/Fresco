'use client';

import React, { useMemo } from 'react';
import { RangePicker, type RangeItem } from './RangePicker';
import { useDatePicker } from './DatePickerContext';
import { getToday, getMonthShortName } from './helpers';

export function MonthPicker() {
  const { date, onChange } = useDatePicker();
  const today = getToday();

  const months: RangeItem[] = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: getMonthShortName(i + 1),
      disabled: !date.year, // Disable if no year is selected
    }));
  }, [date.year]);

  const handleSelect = (month: number) => {
    onChange({ month, day: null });
  };

  const todayMonth = date.year === today.year ? today.month : null;

  return (
    <RangePicker
      type="month"
      range={months}
      value={date.month}
      today={todayMonth}
      onSelect={handleSelect}
    />
  );
}