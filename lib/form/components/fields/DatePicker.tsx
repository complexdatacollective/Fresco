'use client';

import { CalendarIcon } from 'lucide-react';
import { type InputHTMLAttributes, useEffect, useRef, useState } from 'react';
import { Button } from '~/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { InputField } from './Input';

type DatePickerFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type'
> & {
  type?: 'year' | 'month' | 'full';
};

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function YearGrid({
  selectedYear,
  onSelect,
  min = 1920,
  max = new Date().getFullYear(),
}: {
  selectedYear?: number;
  onSelect: (year: number) => void;
  min?: number;
  max?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const years = [];
  for (let year = min; year <= max; year++) {
    years.push(year);
  }

  useEffect(() => {
    if (containerRef.current) {
      const targetYear = selectedYear ?? new Date().getFullYear();
      const yearButton = containerRef.current.querySelector(
        `[data-year="${targetYear}"]`,
      );
      if (yearButton) {
        yearButton.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [selectedYear]);

  return (
    <div
      ref={containerRef}
      className="grid max-h-[300px] grid-cols-4 gap-2 overflow-y-auto"
    >
      {years.map((year) => (
        <Button
          key={year}
          data-year={year}
          type="button"
          variant={selectedYear === year ? 'default' : 'outline'}
          size="sm"
          className="h-8 w-full"
          onClick={() => onSelect(year)}
        >
          {year}
        </Button>
      ))}
    </div>
  );
}

function MonthGrid({
  selectedMonth,
  onSelect,
}: {
  selectedMonth?: number;
  onSelect: (month: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {months.map((month, index) => (
        <Button
          key={month}
          type="button"
          variant={selectedMonth === index + 1 ? 'default' : 'outline'}
          size="sm"
          className="h-8 w-full"
          onClick={() => onSelect(index + 1)}
        >
          {month}
        </Button>
      ))}
    </div>
  );
}

export function DatePickerField({
  type: resolutionType = 'full',
  min,
  max,
  value,
  onChange,
  placeholder,
  ...props
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState((value as string) || '');
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [viewMode, setViewMode] = useState<'year' | 'month'>('year');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const minYear = min ? parseInt(min as string) : 1920;
  const maxYear = max ? parseInt(max as string) : currentYear;

  useEffect(() => {
    if (value) {
      setInputValue(value as string);
      if (resolutionType === 'year') {
        const year = parseInt(value as string);
        if (!isNaN(year)) {
          setSelectedYear(year);
        }
      } else if (resolutionType === 'month') {
        const parts = (value as string).split('/');
        if (parts.length === 2) {
          const month = parseInt(parts[0] ?? '');
          const year = parseInt(parts[1] ?? '');
          if (!isNaN(month) && !isNaN(year)) {
            setSelectedMonth(month);
            setSelectedYear(year);
          }
        }
      }
    }
  }, [value, resolutionType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (resolutionType === 'year') {
      // Only allow 4 digits
      newValue = newValue.replace(/\D/g, '').slice(0, 4);
      setInputValue(newValue);

      if (newValue.length === 4) {
        const year = parseInt(newValue);
        if (year >= minYear && year <= maxYear) {
          setSelectedYear(year);
          onChange?.(e);
        }
      }
    } else if (resolutionType === 'month') {
      // Format as MM/YYYY
      newValue = newValue.replace(/\D/g, '');

      if (newValue.length <= 2) {
        setInputValue(newValue);
      } else if (newValue.length <= 6) {
        const month = newValue.slice(0, 2);
        const year = newValue.slice(2);
        setInputValue(`${month}/${year}`);
      }

      // Validate and update state when complete
      if (newValue.length === 6) {
        const month = parseInt(newValue.slice(0, 2));
        const year = parseInt(newValue.slice(2));
        if (month >= 1 && month <= 12 && year >= minYear && year <= maxYear) {
          setSelectedMonth(month);
          setSelectedYear(year);
          e.target.value = `${String(month).padStart(2, '0')}/${year}`;
          onChange?.(e);
        }
      }
    } else {
      // Default date input
      setInputValue(newValue);
      onChange?.(e);
    }
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);

    if (resolutionType === 'year') {
      setInputValue(String(year));
      setOpen(false);
      if (inputRef.current) {
        inputRef.current.value = String(year);
        const nativeEvent = new Event('change', { bubbles: true });
        Object.defineProperty(nativeEvent, 'target', {
          writable: false,
          value: inputRef.current,
        });
        onChange?.(
          nativeEvent as unknown as React.ChangeEvent<HTMLInputElement>,
        );
      }
    } else if (resolutionType === 'month') {
      setViewMode('month');
    }
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    if (selectedYear) {
      const formattedValue = `${String(month).padStart(2, '0')}/${selectedYear}`;
      setInputValue(formattedValue);
      setOpen(false);
      setViewMode('year');
      if (inputRef.current) {
        inputRef.current.value = formattedValue;
        const nativeEvent = new Event('change', { bubbles: true });
        Object.defineProperty(nativeEvent, 'target', {
          writable: false,
          value: inputRef.current,
        });
        onChange?.(
          nativeEvent as unknown as React.ChangeEvent<HTMLInputElement>,
        );
      }
    }
  };

  if (resolutionType === 'full') {
    // For full date, use native date input
    return (
      <InputField
        type="date"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        {...props}
      />
    );
  }

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (resolutionType === 'year') return 'YYYY';
    if (resolutionType === 'month') return 'MM/YYYY';
    return '';
  };

  return (
    <div className="relative">
      <InputField
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={getPlaceholder()}
        {...props}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 h-10 w-10 p-0"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          {resolutionType === 'year' && (
            <YearGrid
              selectedYear={selectedYear}
              onSelect={handleYearSelect}
              min={minYear}
              max={maxYear}
            />
          )}
          {resolutionType === 'month' && (
            <>
              {viewMode === 'year' ? (
                <div>
                  <div className="mb-2 text-center text-sm font-medium">
                    Select Year
                  </div>
                  <YearGrid
                    selectedYear={selectedYear}
                    onSelect={handleYearSelect}
                    min={minYear}
                    max={maxYear}
                  />
                </div>
              ) : (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('year')}
                    >
                      ← {selectedYear}
                    </Button>
                    <span className="text-sm font-medium">Select Month</span>
                  </div>
                  <MonthGrid
                    selectedMonth={selectedMonth}
                    onSelect={handleMonthSelect}
                  />
                </div>
              )}
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
