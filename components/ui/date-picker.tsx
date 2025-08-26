'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

import { Button } from '~/components/ui/Button';
import { Calendar } from '~/components/ui/calendar';
import { Input } from '~/components/ui/Input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { cx } from '~/utils/cva';

function formatDate(date: Date | undefined, locale?: string) {
  if (!date) {
    return '';
  }
  return date.toLocaleDateString(locale, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
};

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(value);
  const [inputValue, setInputValue] = React.useState(() => formatDate(value));
  
  // Get user's locale and determine placeholder
  const locale = navigator.language;
  const isUSLocale = locale.includes('US') || locale.includes('en');
  const defaultPlaceholder = isUSLocale ? 'MM/DD/YYYY' : 'DD/MM/YYYY';

  return (
    <div className={cx('relative', className)}>
      <Input
        value={inputValue}
        placeholder={placeholder ?? defaultPlaceholder}
        disabled={disabled}
        onChange={(e) => {
          const date = new Date(e.target.value);
          setInputValue(e.target.value);
          if (isValidDate(date)) {
            // Check if date is within allowed range
            const isWithinRange = 
              (!minDate || date >= minDate) && 
              (!maxDate || date <= maxDate);
            
            if (isWithinRange) {
              onChange?.(date);
              setMonth(date);
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        rightAdornment={
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="h-6 w-6"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                <span className="sr-only">Select date</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={value}
                captionLayout="dropdown"
                month={month}
                onMonthChange={setMonth}
                disabled={
                  minDate || maxDate
                    ? (date) => {
                        if (minDate && date < minDate) return true;
                        if (maxDate && date > maxDate) return true;
                        return false;
                      }
                    : undefined
                }
                onSelect={(date) => {
                  onChange?.(date);
                  setInputValue(formatDate(date, locale));
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        }
      />
    </div>
  );
}
