'use client';

import React, { useMemo } from 'react';
import { RangePicker, type RangeItem } from './RangePicker';
import { useDatePicker } from './DatePickerContext';
import { getToday, getDaysInMonth, getFirstDayOfMonth } from './helpers';

export function DayPicker() {
  const { date, onChange } = useDatePicker();
  const today = getToday();

  const days: RangeItem[] = useMemo(() => {
    if (!date.year || !date.month) {
      return [];
    }

    const daysInMonth = getDaysInMonth(date.year, date.month);
    return Array.from({ length: daysInMonth }, (_, i) => ({
      value: i + 1,
      label: String(i + 1),
    }));
  }, [date.year, date.month]);

  const handleSelect = (day: number) => {
    onChange({ day });
  };

  const todayDay = 
    date.year === today.year && date.month === today.month 
      ? today.day 
      : null;

  const offset = date.year && date.month 
    ? getFirstDayOfMonth(date) 
    : 0;

  return (
    <RangePicker
      type="day"
      range={days}
      value={date.day}
      today={todayDay}
      onSelect={handleSelect}
      offset={offset}
    />
  );
}