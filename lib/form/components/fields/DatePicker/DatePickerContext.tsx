'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { type DateParts, type DateRange, datePartsToString, stringToDateParts, isComplete, isEmpty } from './helpers';

export type DateType = 'full' | 'month' | 'year';

type DatePickerContextValue = {
  date: DateParts;
  range: DateRange;
  type: DateType;
  value: string | null;
  isEmpty: boolean;
  isComplete: boolean;
  onChange: (updates: Partial<DateParts>) => void;
  onValueChange: (value: string | null) => void;
  reset: () => void;
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null);

export function useDatePicker() {
  const context = useContext(DatePickerContext);
  if (!context) {
    throw new Error('useDatePicker must be used within a DatePickerProvider');
  }
  return context;
}

type DatePickerProviderProps = {
  children: React.ReactNode;
  value?: string | null;
  onChange?: (value: string | null) => void;
  type?: DateType;
  range?: DateRange;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePickerProvider({
  children,
  value = null,
  onChange,
  type = 'full',
  range,
  minDate,
  maxDate,
}: DatePickerProviderProps) {
  const initialDate = useMemo(() => stringToDateParts(value), [value]);
  const [date, setDate] = useState<DateParts>(initialDate);

  const defaultRange: DateRange = useMemo(() => {
    const now = new Date();
    const startYear = minDate?.getFullYear() ?? now.getFullYear() - 100;
    const endYear = maxDate?.getFullYear() ?? now.getFullYear() + 100;
    
    return {
      start: {
        year: startYear,
        month: 1,
        day: 1,
      },
      end: {
        year: endYear,
        month: 12,
        day: 31,
      },
    };
  }, [minDate, maxDate]);

  const actualRange = range ?? defaultRange;

  const handleChange = useCallback((updates: Partial<DateParts>) => {
    setDate(prev => {
      const newDate = { ...prev, ...updates };
      
      // If month changes, validate day
      if (updates.month !== undefined && newDate.year && newDate.month && newDate.day) {
        const daysInMonth = new Date(newDate.year, newDate.month, 0).getDate();
        if (newDate.day > daysInMonth) {
          newDate.day = daysInMonth;
        }
      }
      
      // Convert to string and notify parent
      const dateString = datePartsToString(newDate);
      onChange?.(dateString);
      
      return newDate;
    });
  }, [onChange]);

  const handleValueChange = useCallback((newValue: string | null) => {
    const newDate = stringToDateParts(newValue);
    setDate(newDate);
    onChange?.(newValue);
  }, [onChange]);

  const reset = useCallback(() => {
    setDate({ year: null, month: null, day: null });
    onChange?.(null);
  }, [onChange]);

  const contextValue = useMemo(() => ({
    date,
    range: actualRange,
    type,
    value: datePartsToString(date),
    isEmpty: isEmpty(date),
    isComplete: isComplete(date, type),
    onChange: handleChange,
    onValueChange: handleValueChange,
    reset,
  }), [date, actualRange, type, handleChange, handleValueChange, reset]);

  return (
    <DatePickerContext.Provider value={contextValue}>
      {children}
    </DatePickerContext.Provider>
  );
}