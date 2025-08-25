'use client';

import * as Popover from '@radix-ui/react-popover';
import { Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { cx } from '~/utils/cva';
import { DatePanels } from './DatePanels';
import { useDatePicker } from './DatePickerContext';
import { getMonthName } from './helpers';

type DatePreviewProps = {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  autoFocus?: boolean;
};

export function DatePreview({
  disabled = false,
  className,
  id,
  autoFocus,
}: DatePreviewProps) {
  const { date, type, isEmpty, isComplete, onChange, reset } = useDatePicker();
  const [open, setOpen] = React.useState(false);

  const handleYearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ year: null, month: null, day: null });
    setOpen(true);
  };

  const handleMonthClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ month: null, day: null });
    setOpen(true);
  };

  const handleDayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ day: null });
    setOpen(true);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    reset();
    setOpen(false);
  };

  React.useEffect(() => {
    if (isComplete) {
      setOpen(false);
    }
  }, [isComplete]);

  const renderDatePart = (
    value: string | number | null,
    placeholder: string,
    onClick?: (e: React.MouseEvent) => void,
  ) => (
    <button
      type="button"
      className={cx(
        'rounded px-2 py-1 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        value ? 'text-foreground' : 'text-muted-foreground',
      )}
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-label={`Edit ${placeholder.toLowerCase()}`}
    >
      {value ?? placeholder}
    </button>
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <motion.button
          id={id}
          type="button"
          className={cx(
            'relative flex w-full items-center justify-between px-3 py-2 min-h-10',
            'rounded-md border text-left',
            'bg-input text-input-foreground',
            'border-border',
            'hover:border-border/80',
            'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          disabled={disabled}
          aria-label="Select date"
          aria-haspopup="dialog"
          aria-expanded={open}
          autoFocus={autoFocus}

        >
          <div className="flex items-center gap-1">
            <Calendar className="text-muted-foreground mr-2 h-4 w-4" />

            {/* Always show the date format structure */}
            <>
              {renderDatePart(date.year, 'Year', handleYearClick)}

              {['full', 'month'].includes(type) && (
                <>
                  <span className="text-muted-foreground">/</span>
                  {renderDatePart(
                    getMonthName(date.month) || null,
                    'Month',
                    handleMonthClick,
                  )}
                </>
              )}

              {type === 'full' && (
                <>
                  <span className="text-muted-foreground">/</span>
                  {renderDatePart(date.day, 'Day', handleDayClick)}
                </>
              )}
            </>
          </div>

          {!isEmpty && (
            <button
              type="button"
              className={cx(
                'ml-2 px-2 py-1 text-sm',
                'underline decoration-primary',
                'hover:cursor-pointer',
                'text-foreground',
              )}
              onClick={handleClear}
              aria-label="Clear date"
            >
              clear
            </button>
          )}
        </motion.button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={cx(
            'bg-popover text-popover-foreground z-50',
            'border-border border',
            'rounded-md shadow-md',
            'min-w-[500px]',
            'animate-in fade-in-0 zoom-in-95',
          )}
          sideOffset={5}
          align="start"
        >
          <DatePanels />
          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
