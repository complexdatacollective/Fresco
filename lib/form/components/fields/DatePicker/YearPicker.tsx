'use client';

import React, { useMemo } from 'react';
import { RangePicker, type RangeItem } from './RangePicker';
import { useDatePicker } from './DatePickerContext';
import { getToday } from './helpers';

export function YearPicker() {
  const { date, range, onChange } = useDatePicker();
  const today = getToday();

  const years: RangeItem[] = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = range.start.year ?? currentYear - 50;
    const endYear = range.end.year ?? currentYear + 50;
    const items: RangeItem[] = [];

    // Limit the range to prevent too many items
    const limitedStart = Math.max(startYear, currentYear - 100);
    const limitedEnd = Math.min(endYear, currentYear + 100);

    for (let year = limitedStart; year <= limitedEnd; year++) {
      items.push({
        value: year,
        label: String(year),
      });
    }

    // console.log('YearPicker: Generated years:', items.length, 'from', limitedStart, 'to', limitedEnd);
    return items;
  }, [range]);

  const handleSelect = (year: number) => {
    onChange({ year, month: null, day: null });
  };

  return (
    <RangePicker
      type="year"
      range={years}
      value={date.year}
      today={today.year}
      onSelect={handleSelect}
    />
  );
}